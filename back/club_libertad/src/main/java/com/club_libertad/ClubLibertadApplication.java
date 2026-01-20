package com.club_libertad;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ClubLibertadApplication {

    public static void main(String[] args) {
        SpringApplication.run(ClubLibertadApplication.class, args);
    }

}
