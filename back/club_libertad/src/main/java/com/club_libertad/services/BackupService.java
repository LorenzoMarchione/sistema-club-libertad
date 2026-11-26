package com.club_libertad.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class BackupService {
    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String datasourceUser;

    @Value("${spring.datasource.password}")
    private String datasourcePassword;

    @Value("${app.backup.db-container:club-libertad-db}") 
    private String dbContainer;

    private static final String BACKUP_DIR = "backups";

    public static class BackupInfo {
        public String fileName;
        public long sizeBytes;
        public String createdAt;
        public BackupInfo(String fileName, long sizeBytes, String createdAt) {
            this.fileName = fileName;
            this.sizeBytes = sizeBytes;
            this.createdAt = createdAt;
        }
    }

    private record DbParams(String host, String port, String dbName) {}

    private DbParams parseUrl() {
        // Expected: jdbc:postgresql://host:port/dbname
        String url = datasourceUrl.replace("jdbc:postgresql://", "");
        String hostPort = url.substring(0, url.indexOf('/'));
        String dbName = url.substring(url.indexOf('/') + 1);
        String host = hostPort.contains(":") ? hostPort.split(":")[0] : hostPort;
        String port = hostPort.contains(":") ? hostPort.split(":")[1] : "5432";
        return new DbParams(host, port, dbName);
    }

    private void consumeStream(InputStream is) {
        new Thread(() -> {
            try (BufferedReader br = new BufferedReader(new InputStreamReader(is))) {
                while (br.readLine() != null) { /* drain */ }
            } catch (Exception ignored) {}
        }).start();
    }

    public List<BackupInfo> listBackups() {
        try {
            Path dir = Paths.get(BACKUP_DIR);
            if (!Files.exists(dir)) {
                return List.of();
            }
            List<BackupInfo> result = new ArrayList<>();
            Files.list(dir)
                .filter(Files::isRegularFile)
                .sorted(Comparator.comparing((Path p) -> p.toFile().lastModified()).reversed())
                .forEach(p -> {
                    File f = p.toFile();
                    String createdAt = LocalDateTime.ofEpochSecond(f.lastModified()/1000, 0, java.time.ZoneOffset.UTC)
                            .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                    result.add(new BackupInfo(f.getName(), f.length(), createdAt));
                });
            return result;
        } catch (IOException e) {
            return List.of();
        }
    }

    private void pruneOldBackups(int keepLast) {
        try {
            Path dir = Paths.get(BACKUP_DIR);
            if (!Files.exists(dir)) {
                return;
            }
            List<Path> files = Files.list(dir)
                    .filter(Files::isRegularFile)
                    .sorted(Comparator.comparingLong((Path p) -> p.toFile().lastModified()).reversed())
                    .toList();
            for (int i = keepLast; i < files.size(); i++) {
                try {
                    Files.deleteIfExists(files.get(i));
                } catch (Exception ignored) {
                }
            }
        } catch (IOException ignored) {
        }
    }

    public boolean restoreBackup(String fileName) throws IOException, InterruptedException {
        if (fileName == null || fileName.isBlank() || fileName.contains("..")
                || fileName.contains("/") || fileName.contains("\\")) {
            return false;
        }

        DbParams params = parseUrl();
        Path dir = Paths.get(BACKUP_DIR);
        Path filePath = dir.resolve(fileName).normalize();
        if (!filePath.startsWith(dir.normalize()) || !Files.exists(filePath)) {
            return false;
        }

        List<String> command = List.of(
                "docker", "exec",
                "-i",
                "-e", "PGPASSWORD=" + datasourcePassword,
                dbContainer,
                "psql",
                "-h", params.host(),
                "-p", params.port(),
                "-U", datasourceUser,
                "-d", params.dbName()
        );

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectInput(filePath.toFile());
        Process process = pb.start();
        consumeStream(process.getInputStream());
        consumeStream(process.getErrorStream());
        int exit = process.waitFor();
        return exit == 0;
    }

    public Optional<String> createBackup() throws IOException, InterruptedException {
        DbParams params = parseUrl();
        Path dir = Paths.get(BACKUP_DIR);
        if (!Files.exists(dir)) Files.createDirectories(dir);

        String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String fileName = String.format("backup_club_libertad_%s.sql", ts);
        Path out = dir.resolve(fileName);

        // Ejecutar pg_dump dentro del contenedor de Postgres y enviar el SQL por stdout
        List<String> command = List.of(
                "docker", "exec",
                "-e", "PGPASSWORD=" + datasourcePassword,
                dbContainer,
                "pg_dump",
                "-h", params.host(),
                "-p", params.port(),
                "-U", datasourceUser,
                "--clean",
                "--if-exists",
                "--no-owner",
                "--no-privileges",
                "-F", "p",
                params.dbName()
        );

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectOutput(out.toFile());
        pb.redirectErrorStream(false);

        Process process = pb.start();
        // Consumir stderr para que el buffer del proceso no se trabe si Postgres emite avisos o errores
        consumeStream(process.getErrorStream());

        int exit = process.waitFor();
        if (exit == 0 && Files.exists(out) && Files.size(out) > 0) {
            pruneOldBackups(6);
            return Optional.of(fileName);
        } else {
            // Limpiar archivo parcial o vacío si falló el dump
            try { Files.deleteIfExists(out); } catch (Exception ignored) {}
            return Optional.empty();
        }
    }

    @Scheduled(cron = "0 0 0 1 * *")
    public void createMonthlyBackup() {
        try {
            createBackup();
        } catch (Exception ignored) {
        }
    }
}
