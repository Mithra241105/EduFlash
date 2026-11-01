package com.eduflash.service;

import com.eduflash.entity.Flashcard;
import com.eduflash.entity.Topic;
import com.eduflash.entity.User;
import com.eduflash.repository.FlashcardRepository;
import com.eduflash.repository.TopicRepository;
import com.eduflash.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.sql.Timestamp;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PracticeService {

    private final FlashcardRepository flashcardRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;

    @Transactional
    public Flashcard reviewFlashcard(Long flashcardId, Long userId, boolean isCorrect) {
        Flashcard flashcard = flashcardRepository.findById(flashcardId)
                .orElseThrow(() -> new RuntimeException("Flashcard not found"));

        if (!flashcard.getDocument().getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: You do not own this flashcard.");
        }

        flashcard.setTimesReviewed(flashcard.getTimesReviewed() + 1);
        flashcard.setLastReviewedAt(new Timestamp(System.currentTimeMillis()));

        int currentMastery = flashcard.getMasteryLevel();
        int newMastery = isCorrect ? currentMastery + 10 : currentMastery - 5;
        
        if (newMastery > 100) {
            newMastery = 100;
        } else if (newMastery < 0) {
            newMastery = 0;
        }
        flashcard.setMasteryLevel(newMastery);
        
        flashcard = flashcardRepository.save(flashcard);

        Topic topic = flashcard.getTopic();
        List<Flashcard> allFlashcards = flashcardRepository.findByTopicId(topic.getId());
        
        if (!allFlashcards.isEmpty()) {
            int totalMastery = 0;
            for (Flashcard fc : allFlashcards) {
                totalMastery += fc.getMasteryLevel();
            }
            int averageMastery = totalMastery / allFlashcards.size();
            topic.setMasteryLevel(averageMastery);
            topicRepository.save(topic);
        }

        if (isCorrect) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            user.setTotalXp(user.getTotalXp() + 5);
            userRepository.save(user);
        }

        return flashcard;
    }

    @Transactional(readOnly = true)
    public Page<Flashcard> getFlashcardsByTopic(Long topicId, Pageable pageable) {
        return flashcardRepository.findByTopicId(topicId, pageable);
    }
}
