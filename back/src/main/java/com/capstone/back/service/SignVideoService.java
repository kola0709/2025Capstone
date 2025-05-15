package com.capstone.back.service;

// import com.capstone.back.entity.SignVideo;
import com.capstone.back.repository.SignVideoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

@Service
public class SignVideoService {
    @Autowired
    private SignVideoRepository signVideoRepository;

    private static final Logger logger = LoggerFactory.getLogger(SignVideoService.class);

    public String getVideoTitle(String name) {
        logger.info("요청된 단어: " + name);

        return signVideoRepository.findByName(name)
                //.map(SignVideo::getTitle)
                //.orElse("영상이 존재하지 않음");
                .map(video -> {
                    logger.info("ㅇ 영상 찾음: " + video.getName());
                    return video.getName();
                })
                .orElseGet(() -> {
                    logger.warn("ㄴ 영상 없음: " + name);
                    return "영상이 존재하지 않음";
                });
    }
}
