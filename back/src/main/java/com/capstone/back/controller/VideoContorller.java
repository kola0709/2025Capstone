package com.capstone.back.controller;

import com.capstone.back.service.SignVideoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sign")
public class VideoContorller {
    // private final String VIDEO_DIRECTORY = "/Users/semi/webCapstone/video"
    @Autowired
    private SignVideoService signVideoService;

    @GetMapping("/{word}")
    public ResponseEntity<String> getSignVideo(@PathVariable String word) {
        String videoTitle = signVideoService.getVideoTitle(word);

        if (videoTitle.equals("영상이 존재하지 않음")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("영상 없음");
        }
        return ResponseEntity.ok(videoTitle);
    }
}
