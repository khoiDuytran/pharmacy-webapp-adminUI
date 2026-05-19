import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tagsApi } from "@/lib/api";

const SLOT_COUNT = 5;

export default function Tags() {
  const [mode,         setMode]         = useState<"list" | "arrange">("list");
  const [draggingId,   setDraggingId]   = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();
  
  const { data: tagRes, isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn:  tagsApi.getAll,
  });

  const tags = Array.isArray(tagRes) ? tagRes : [];

  const updateMut = useMutation({
    mutationFn: ({ id, data}: any) => tagsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tags"] }); toast({ title: "Cập nhật thành công" }); },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  })

  const toggleEnable = (tag: any) => {
    updateMut.mutate({ 
      id: tag.id,
      data: { 
        enabled: !tag.enabled,
        order: tag.order
      } 
    });
  };

  // ===== DRAG & DROP (arrange mode) =====
  const handleDragStart = (e: any, tagId: string) => {
    setDraggingId(tagId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: any, order: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSlot(order);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverSlot(null);
  };

  const handleDrop = async (e: any, targetOrder: number) => {
    e.preventDefault();
    if (!draggingId) return;

    const draggedTag = tags.find((t) => t.id === draggingId);
    const targetTag  = tags.find((t) => t.order === targetOrder);

    if (!draggedTag || draggedTag.order === targetOrder) {
      setDraggingId(null);
      setDragOverSlot(null);
      return;
    }

    const oldOrder = draggedTag.order;

    // Update dragged section
    await updateMut.mutateAsync({ 
      id: draggedTag.id, 
      data: { 
        order: targetOrder,
        enabled: draggedTag.enabled
      } 
    });

    // Update target section if exists
    if (targetTag) {
      await updateMut.mutateAsync({ 
        id: targetTag.id, 
        data: { 
          order: oldOrder,
          enabled: targetTag.enabled
        } 
      });
    }

    setDraggingId(null);
    setDragOverSlot(null);
  };

  // Slots 1-based
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => ({
    order: i + 1,
    tag:   tags.find((t) => t.order === i + 1) || null,
  }));

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Thẻ</h1>
        </div>
        <Button
          variant={mode === "arrange" ? "default" : "outline"}
          onClick={() => setMode(mode === "list" ? "arrange" : "list")}
        >
          {mode === "list" ? "⇄ Sắp xếp vị trí" : "✓ Xem danh sách"}
        </Button>
      </div>

      {/* ===== Preview bar ===== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">
            XEM TRƯỚC THANH ĐIỀU HƯỚNG
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {slots.map((slot) => (
              <div
                key={slot.order}
                className={`flex-1 min-w-24 flex flex-col items-center gap-2 p-3 rounded-lg border transition ${
                  slot.tag?.enabled
                    ? "bg-muted border-border"
                    : "bg-muted/40 border-dashed border-border opacity-50"
                }`}
              >
                {slot.tag ? (
                  <>
                    <span className="text-xs font-medium text-center line-clamp-2">
                      {slot.tag.name}
                    </span>
                    { slot.tag.enabled ? (
                      <span className="text-xs text-stat-green">(Hiển thị)</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">(Tắt hiển thị)</span>
                    )}
                  </>
                ) : (
                  <span className="text-xl text-muted-foreground py-2">—</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===== ARRANGE MODE ===== */}
      {mode === "arrange" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sắp xếp vị trí thẻ</CardTitle>
            <p className="text-sm text-muted-foreground">
              Kéo thẻ vào các ô vị trí để thay đổi thứ tự hiển thị
            </p>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              {/* Slots */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground tracking-wide">
                  VỊ TRÍ HIỂN THỊ
                </p>
                {slots.map((slot) => (
                  <div
                    key={slot.order}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg min-h-14 transition-all ${
                      dragOverSlot === slot.order
                        ? "border-primary bg-primary/5"
                        : slot.tag
                        ? "border-primary/30 bg-primary/5"
                        : "border-dashed border-border bg-muted/30"
                    }`}
                    onDragOver={(e) => handleDragOver(e, slot.order)}
                    onDrop={(e) => handleDrop(e, slot.order)}
                  >
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {slot.order}
                    </div>

                    {slot.tag ? (
                      <div
                        className={`flex items-center gap-2 flex-1 px-2 py-1 rounded cursor-grab active:cursor-grabbing ${
                          draggingId === slot.tag.id ? "opacity-40" : ""
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, slot.tag!.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <span className="text-sm font-medium flex-1">
                          {slot.tag.name}
                        </span>
                        {!slot.tag.enabled && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            Tắt
                          </span>
                        )}
                        <span className="text-muted-foreground text-base">⠿</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        Kéo thẻ vào đây...
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== LIST MODE ===== */}
      {mode === "list" && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center w-12">STT</TableHead>
                  <TableHead>Thẻ</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-center">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : tags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  tags.map((tag, i) => (
                    <TableRow key={tag.id}>
                      <TableCell>
                        <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mx-auto">
                          {tag.order}
                        </span>
                      </TableCell>
                      <TableCell className="text-left">
                        <div>
                          <p className="font-medium">{tag.name}</p>
                          <p className="text-xs text-muted-foreground">{tag.type}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleEnable(tag)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            tag.enabled
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {tag.enabled ? "ON" : "OFF"}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}