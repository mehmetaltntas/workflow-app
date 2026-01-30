package com.workflow.backend.controller;

import com.workflow.backend.dto.CreateConnectionRequest;
import com.workflow.backend.dto.ConnectionResponse;
import com.workflow.backend.hateoas.assembler.ConnectionModelAssembler;
import com.workflow.backend.hateoas.model.ConnectionModel;
import com.workflow.backend.service.ConnectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/connections")
@RequiredArgsConstructor
@Tag(name = "Connections", description = "Baglanti islemleri")
@SecurityRequirement(name = "bearerAuth")
public class ConnectionController {

    private final ConnectionService connectionService;
    private final ConnectionModelAssembler connectionAssembler;

    @Operation(summary = "Baglanti istegi gonder", description = "Baska bir kullaniciya baglanti istegi gonderir")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Baglanti istegi gonderildi"),
            @ApiResponse(responseCode = "400", description = "Gecersiz istek"),
            @ApiResponse(responseCode = "401", description = "Kimlik dogrulama gerekli"),
            @ApiResponse(responseCode = "404", description = "Kullanici bulunamadi")
    })
    @PostMapping
    public ResponseEntity<ConnectionModel> sendConnectionRequest(@Valid @RequestBody CreateConnectionRequest request) {
        ConnectionResponse result = connectionService.sendConnectionRequest(request.getTargetUserId());
        ConnectionModel model = connectionAssembler.toModel(result);
        return ResponseEntity.status(HttpStatus.CREATED).body(model);
    }

    @Operation(summary = "Baglanti istegini kabul et")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Baglanti kabul edildi"),
            @ApiResponse(responseCode = "400", description = "Gecersiz istek"),
            @ApiResponse(responseCode = "404", description = "Baglanti bulunamadi")
    })
    @PatchMapping("/{id}/accept")
    public ResponseEntity<ConnectionModel> acceptConnection(
            @Parameter(description = "Baglanti ID") @PathVariable Long id) {
        ConnectionResponse result = connectionService.acceptConnectionRequest(id);
        ConnectionModel model = connectionAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Baglanti istegini reddet")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Baglanti reddedildi"),
            @ApiResponse(responseCode = "400", description = "Gecersiz istek"),
            @ApiResponse(responseCode = "404", description = "Baglanti bulunamadi")
    })
    @PatchMapping("/{id}/reject")
    public ResponseEntity<ConnectionModel> rejectConnection(
            @Parameter(description = "Baglanti ID") @PathVariable Long id) {
        ConnectionResponse result = connectionService.rejectConnectionRequest(id);
        ConnectionModel model = connectionAssembler.toModel(result);
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Bekleyen baglanti isteklerini getir")
    @GetMapping("/pending")
    public ResponseEntity<PagedModel<ConnectionModel>> getPendingRequests(
            @Parameter(description = "Sayfa numarasi (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Sayfa boyutu") @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<ConnectionResponse> resultPage = connectionService.getPendingRequests(pageable);
        List<ConnectionModel> models = resultPage.getContent().stream()
                .map(connectionAssembler::toModel)
                .collect(Collectors.toList());

        PagedModel.PageMetadata metadata = new PagedModel.PageMetadata(
                resultPage.getSize(), resultPage.getNumber(),
                resultPage.getTotalElements(), resultPage.getTotalPages());

        return ResponseEntity.ok(PagedModel.of(models, metadata));
    }

    @Operation(summary = "Gonderilen baglanti isteklerini getir")
    @GetMapping("/sent")
    public ResponseEntity<PagedModel<ConnectionModel>> getSentRequests(
            @Parameter(description = "Sayfa numarasi (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Sayfa boyutu") @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<ConnectionResponse> resultPage = connectionService.getSentRequests(pageable);
        List<ConnectionModel> models = resultPage.getContent().stream()
                .map(connectionAssembler::toModel)
                .collect(Collectors.toList());

        PagedModel.PageMetadata metadata = new PagedModel.PageMetadata(
                resultPage.getSize(), resultPage.getNumber(),
                resultPage.getTotalElements(), resultPage.getTotalPages());

        return ResponseEntity.ok(PagedModel.of(models, metadata));
    }

    @Operation(summary = "Kabul edilmis baglantiları sayfalanmis olarak getir")
    @GetMapping("/accepted")
    public ResponseEntity<PagedModel<ConnectionModel>> getAcceptedConnections(
            @Parameter(description = "Sayfa numarasi (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Sayfa boyutu") @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<ConnectionResponse> resultPage = connectionService.getAcceptedConnections(pageable);
        List<ConnectionModel> models = resultPage.getContent().stream()
                .map(connectionAssembler::toModel)
                .collect(Collectors.toList());

        PagedModel.PageMetadata metadata = new PagedModel.PageMetadata(
                resultPage.getSize(), resultPage.getNumber(),
                resultPage.getTotalElements(), resultPage.getTotalPages());

        return ResponseEntity.ok(PagedModel.of(models, metadata));
    }

    @Operation(summary = "Baglantiyi kaldir")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Baglanti kaldirildi"),
            @ApiResponse(responseCode = "400", description = "Gecersiz istek"),
            @ApiResponse(responseCode = "404", description = "Baglanti bulunamadi")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeConnection(
            @Parameter(description = "Baglanti ID") @PathVariable Long id) {
        connectionService.removeConnection(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Kendi baglanti sayisini getir")
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getConnectionCount() {
        long count = connectionService.getMyConnectionCount();
        return ResponseEntity.ok(Map.of("count", count));
    }
}
