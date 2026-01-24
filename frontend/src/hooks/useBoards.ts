import { useState, useEffect, useCallback } from "react";
import { boardService } from "../services/api";
import type { Board } from "../types";
import toast from "react-hot-toast";

export const useBoards = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Kullanıcı ID'yi al
  const userId = Number(localStorage.getItem("userId"));

  const loadBoards = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await boardService.getUserBoards(userId);
      setBoards(result.content || []);
    } catch (error) {
      console.error("Panolar yüklenemedi", error);
      toast.error("Panolar yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  const createBoard = async (name: string, status: string = "PLANLANDI", link?: string, description?: string, deadline?: string) => {
    if (!name.trim() || !userId) return false;

    try {
      await boardService.createBoard({
        name: name,
        status: status,
        userId: userId,
        link: link,
        description: description,
        deadline: deadline,
      });
      toast.success("Pano oluşturuldu");
      await loadBoards(); // Listeyi güncelle
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Pano oluşturulamadı");
      return false;
    }
  };

  const updateBoard = async (boardId: number, data: { name?: string; status?: string; link?: string; description?: string; deadline?: string }) => {
      try {
          // Backend CreateBoardRequest userId gerektirir
          await boardService.updateBoard(boardId, { ...data, userId });
          toast.success("Pano güncellendi");
          await loadBoards();
          return true;
      } catch (error) {
          console.error(error);
          toast.error("Pano güncellenemedi");
          return false;
      }
  };

  const deleteBoard = async (boardId: number) => {
      try {
          await boardService.deleteBoard(boardId);
          toast.success("Pano silindi");
          await loadBoards();
          return true;
      } catch (error) {
          console.error(error);
          toast.error("Pano silinemedi");
          return false;
      }
  }

  const updateBoardStatus = async (boardId: number, newStatus: string) => {
    try {
      await boardService.updateBoardStatus(boardId, newStatus);
      toast.success("Statü güncellendi");
      await loadBoards();
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Statü güncellenemedi");
      return false;
    }
  };

  return {
    boards,
    loading,
    refreshBoards: loadBoards,
    createBoard,
    updateBoard,
    deleteBoard,
    updateBoardStatus,
    userId // export userId in case components need to check auth
  };
};
