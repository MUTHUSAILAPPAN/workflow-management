package com.workflow.automation.workflowbackend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class WorkflowBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(WorkflowBackendApplication.class, args);
	}

}
