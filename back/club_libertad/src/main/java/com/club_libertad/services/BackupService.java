package com.club_libertad.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
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

    public Optional<String> createBackup() throws IOException, InterruptedException {
        DbParams params = parseUrl();
        Path dir = Paths.get(BACKUP_DIR);
        if (!Files.exists(dir)) Files.createDirectories(dir);
        String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String fileName = String.format("backup_club_libertad_%s.sql", ts);
        Path out = dir.resolve(fileName);

        // Build pg_dump command
        List<String> command = List.of(
                "pg_dump",
                "-h", params.host(),
                "-p", params.port(),
                "-U", datasourceUser,
                "-F", "p",
                "-f", out.toAbsolutePath().toString(),
                params.dbName()
        );

        ProcessBuilder pb = new ProcessBuilder(command);
        // Provide password via env var (PGPASSWORD) to avoid interactive prompt
        pb.environment().put("PGPASSWORD", datasourcePassword);
        pb.redirectErrorStream(true);
        Process process = pb.start();
        int exit = process.waitFor();
        if (exit == 0 && Files.exists(out)) {
            return Optional.of(fileName);
        } else {
            // Clean up on failure
            try { Files.deleteIfExists(out); } catch (Exception ignored) {}
            return Optional.empty();
        }
    }
}
