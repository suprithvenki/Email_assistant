package com.email.email_assistant.controller;

import lombok.Data;

@Data
public class EmailRequest {
    private String emailContent;
    private String tone;

}
