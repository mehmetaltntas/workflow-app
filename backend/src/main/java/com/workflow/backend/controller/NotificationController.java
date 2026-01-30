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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.hateoas.PagedModel;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

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

    @Operation(summary = "Bildirimleri sayfalanmis olarak getir")
    @GetMapping
    public ResponseEntity<PagedModel<NotificationModel>> getNotifications(
            @Parameter(description = "Sayfa numarasi (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Sayfa boyutu") @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<NotificationResponse> resultPage = notificationService.getNotifications(pageable);
        List<NotificationModel> models = resultPage.getContent().stream()
                .map(notificationAssembler::toModel)
                .collect(Collectors.toList());

        PagedModel.PageMetadata metadata = new PagedModel.PageMetadata(
                resultPage.getSize(),
                resultPage.getNumber(),
                resultPage.getTotalElements(),
                resultPage.getTotalPages()
        );

        PagedModel<NotificationModel> pagedModel = PagedModel.of(models, metadata);
        pagedModel.add(linkTo(methodOn(NotificationController.class)
                .getNotifications(page, size))
                .withSelfRel());

        return ResponseEntity.ok(pagedModel);
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
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Bildirimi sil")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @Parameter(description = "Bildirim ID") @PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.noContent().build();
    }
}
