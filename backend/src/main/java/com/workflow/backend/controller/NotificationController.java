package com.workflow.backend.controller;

import com.workflow.backend.dto.NotificationResponse;
import com.workflow.backend.hateoas.assembler.NotificationModelAssembler;
import com.workflow.backend.hateoas.model.NotificationModel;
import com.workflow.backend.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.hateoas.CollectionModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Bildirim islemleri")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationModelAssembler notificationAssembler;

    @Operation(summary = "Tum bildirimleri getir")
    @GetMapping
    public ResponseEntity<CollectionModel<NotificationModel>> getNotifications() {
        List<NotificationResponse> results = notificationService.getNotifications();
        List<NotificationModel> models = results.stream()
                .map(notificationAssembler::toModel)
                .collect(Collectors.toList());
        return ResponseEntity.ok(CollectionModel.of(models));
    }

    @Operation(summary = "Okunmamis bildirim sayisini getir")
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        long count = notificationService.getUnreadCount();
        return ResponseEntity.ok(Map.of("count", count));
    }

    @Operation(summary = "Bildirimi okundu olarak isaretle")
    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationModel> markAsRead(
            @Parameter(description = "Bildirim ID") @PathVariable Long id) {
        NotificationResponse result = notificationService.markAsRead(id);
        NotificationModel model = notificationAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Tum bildirimleri okundu olarak isaretle")
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok().build();
    }
}
