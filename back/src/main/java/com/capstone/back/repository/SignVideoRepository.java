package com.capstone.back.repository;

import com.capstone.back.entity.SignVideo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SignVideoRepository extends JpaRepository<SignVideo, Long> {
    Optional<SignVideo> findByName(String name);
}
