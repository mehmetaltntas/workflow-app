package com.workflow.backend.service;

import com.workflow.backend.dto.CreateLabelRequest;
import com.workflow.backend.dto.LabelDto;
import com.workflow.backend.entity.Board;
import com.workflow.backend.entity.Label;
import com.workflow.backend.repository.BoardRepository;
import com.workflow.backend.repository.LabelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class LabelService {

    private final LabelRepository labelRepository;
    private final BoardRepository boardRepository;
    private final AuthorizationService authorizationService;

    // Varsayılan etiketler için rezerve edilmiş renkler (başka etiketlerde kullanılamaz)
    private static final Set<String> RESERVED_COLORS = Set.of(
        "#ef4444",  // Zor - Kırmızı
        "#f59e0b",  // Orta - Turuncu/Sarı
        "#22c55e"   // Kolay - Yeşil
    );

    // Maksimum kullanıcı etiketi sayısı (3 varsayılan etiket hariç)
    private static final int MAX_USER_LABELS_PER_BOARD = 7;

    // Panoya ait tüm etiketleri getir
    public List<LabelDto> getLabelsByBoardId(Long boardId) {
        // Kullanıcı sadece kendi panosunun etiketlerini görebilir
        authorizationService.verifyBoardOwnership(boardId);

        return labelRepository.findByBoardId(boardId).stream()
                .map(this::mapToDto)
                .toList();
    }

    // Yeni etiket oluştur
    @Transactional
    public LabelDto createLabel(CreateLabelRequest request) {
        // Kullanıcı sadece kendi panosuna etiket ekleyebilir
        authorizationService.verifyBoardOwnership(request.getBoardId());

        Board board = boardRepository.findById(request.getBoardId())
                .orElseThrow(() -> new RuntimeException("Pano bulunamadı!"));

        // Maksimum kullanıcı etiketi sayısını kontrol et
        List<Label> existingLabels = labelRepository.findByBoard(board);
        long userLabelCount = existingLabels.stream()
                .filter(l -> !Boolean.TRUE.equals(l.getIsDefault()))
                .count();
        if (userLabelCount >= MAX_USER_LABELS_PER_BOARD) {
            throw new RuntimeException("Maksimum " + MAX_USER_LABELS_PER_BOARD + " adet özel etiket oluşturabilirsiniz!");
        }

        // Aynı isimde etiket var mı kontrol et
        if (labelRepository.existsByNameAndBoard(request.getName(), board)) {
            throw new RuntimeException("Bu isimde bir etiket zaten var!");
        }

        // Rezerve edilmiş renkler kullanılamaz
        if (RESERVED_COLORS.contains(request.getColor().toLowerCase())) {
            throw new RuntimeException("Bu renk varsayılan etiketler için ayrılmıştır!");
        }

        Label label = new Label();
        label.setName(request.getName());
        label.setColor(request.getColor());
        label.setBoard(board);

        Label savedLabel = labelRepository.save(label);
        return mapToDto(savedLabel);
    }

    // Etiket güncelle
    @Transactional
    public LabelDto updateLabel(Long labelId, LabelDto request) {
        // Kullanıcı sadece kendi etiketini güncelleyebilir
        authorizationService.verifyLabelOwnership(labelId);

        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new RuntimeException("Etiket bulunamadı!"));

        // Varsayılan etiketler düzenlenemez
        if (Boolean.TRUE.equals(label.getIsDefault())) {
            throw new RuntimeException("Varsayılan etiketler düzenlenemez!");
        }

        // İsim değiştiyse ve başka bir etiket aynı isme sahipse hata ver
        if (request.getName() != null && !request.getName().equals(label.getName())) {
            if (labelRepository.existsByNameAndBoard(request.getName(), label.getBoard())) {
                throw new RuntimeException("Bu isimde bir etiket zaten var!");
            }
            label.setName(request.getName());
        }

        // Renk değiştiyse ve rezerve edilmiş bir renk mi kontrol et
        if (request.getColor() != null && !request.getColor().equals(label.getColor())) {
            if (RESERVED_COLORS.contains(request.getColor().toLowerCase())) {
                throw new RuntimeException("Bu renk varsayılan etiketler için ayrılmıştır!");
            }
            label.setColor(request.getColor());
        }

        Label savedLabel = labelRepository.save(label);
        return mapToDto(savedLabel);
    }

    // Etiket sil
    @Transactional
    public void deleteLabel(Long labelId) {
        // Kullanıcı sadece kendi etiketini silebilir
        authorizationService.verifyLabelOwnership(labelId);

        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new RuntimeException("Etiket bulunamadı!"));

        // Varsayılan etiketler silinemez
        if (Boolean.TRUE.equals(label.getIsDefault())) {
            throw new RuntimeException("Varsayılan etiketler silinemez!");
        }

        // Önce tüm görevlerden bu etiketi kaldır
        label.getTasks().forEach(task -> task.getLabels().remove(label));

        labelRepository.delete(label);
    }

    // Entity -> DTO çevirici
    private LabelDto mapToDto(Label label) {
        LabelDto dto = new LabelDto();
        dto.setId(label.getId());
        dto.setName(label.getName());
        dto.setColor(label.getColor());
        dto.setIsDefault(label.getIsDefault());
        return dto;
    }

    // Panoya varsayılan etiketleri oluştur
    @Transactional
    public void createDefaultLabelsForBoard(Board board) {
        // Varsayılan etiketler: Kolay (yeşil), Orta (sarı), Zor (kırmızı)
        String[][] defaultLabels = {
            {"Kolay", "#22c55e"},  // Green
            {"Orta", "#f59e0b"},   // Amber
            {"Zor", "#ef4444"}     // Red
        };

        for (String[] labelData : defaultLabels) {
            Label label = new Label();
            label.setName(labelData[0]);
            label.setColor(labelData[1]);
            label.setBoard(board);
            label.setIsDefault(true);
            labelRepository.save(label);
        }
    }
}
