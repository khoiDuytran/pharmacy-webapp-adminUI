import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { discountEventApi, productsApi } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from "@/components/ui/select";

const STATUS_LABELS: Record<string, string> = {
  true:  "Đang hoạt động",
  false: "Không hoạt động",
};

const EMPTY_FORM = {
  name:            "",
  description:     "",
  startDate:       "",
  endDate:         "",
  active:          "true",
  discountPercent: "0",
  productIds:      [] as string[],
};

export default function FlashSale() {
  const [dialogOpen,    setDialogOpen]    = useState(false);
  const [productDialog, setProductDialog] = useState(false); // dialog xem SP
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [deleteId,      setDeleteId]      = useState<string | null>(null);
  const [editEvent,     setEditEvent]     = useState<any>(null);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [searchProduct, setSearchProduct] = useState("");

  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: eventRes, isLoading } = useQuery({
    queryKey: ["event"],
    queryFn:  () => discountEventApi.getAll(),
  });

  const { data: productsRes } = useQuery({
    queryKey: ["products"],
    queryFn:  () => productsApi.getAll(),
  });

  const eventList   = Array.isArray(eventRes)    ? eventRes    : [];
  const productList = Array.isArray(productsRes) ? productsRes : [];
  const productMap  = new Map(productList.map((p: any) => [p._id || p.id, p]));

  // Sản phẩm trong sự kiện đang xem
  const eventProducts = selectedEvent?.productIds
    ? selectedEvent.productIds.map((id: string) => {
        const detail = productMap.get(id) as any;
        return {
          id,
          name:  detail?.name  || id.slice(-8),
          image: detail?.urlImages?.[0] || "",
          price: detail?.price || 0,
          stock: detail?.quantity || 0,
        };
      })
    : [];

  // Sản phẩm chưa có trong sự kiện (để thêm)
  const availableProducts = productList.filter((p: any) => {
    const id = p._id || p.id;
    const inEvent = form.productIds.includes(id);
    const matchSearch = p.name?.toLowerCase().includes(searchProduct.toLowerCase());
    return !inEvent && matchSearch;
  });

  // Mutations
  const createMut = useMutation({
    mutationFn: (data: any) => discountEventApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["event"] }); toast({ title: "Đã thêm sự kiện" }); setDialogOpen(false); },
    onError:   (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => discountEventApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["event"] }); toast({ title: "Đã cập nhật" }); setDialogOpen(false); },
    onError:   (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => discountEventApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["event"] }); toast({ title: "Đã xóa" }); setDeleteId(null); },
    onError:   (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const addProductMut = useMutation({
    mutationFn: ({ eventId, productId }: any) =>
      discountEventApi.addProductToEvent(eventId, productId),
    onSuccess: (_, { productId }) => {
      qc.invalidateQueries({ queryKey: ["event"] });
      setSelectedEvent((prev: any) => ({
        ...prev,
        productIds: [...(prev.productIds || []), productId],
      }));
      toast({ title: "Đã thêm sản phẩm" });
    },
    onError: (e: any) =>
      toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const removeProductMut = useMutation({
    mutationFn: ({ eventId, productId }: any) =>
      discountEventApi.removeProductFromEvent(eventId, productId),
    onSuccess: (_, { productId }) => {
      qc.invalidateQueries({ queryKey: ["event"] });
      setSelectedEvent((prev: any) => ({
        ...prev,
        productIds: (prev.productIds || []).filter((id: string) => id !== productId),
      }));
      toast({ title: "Đã xóa sản phẩm" });
    },
    onError: (e: any) =>
      toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const statusStyle = (active: boolean) =>
    active ? "bg-stat-green/15 text-stat-green" : "bg-stat-red/15 text-stat-red";

  const openCreate = () => {
    setEditEvent(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (e: any) => {
    setEditEvent(e);
    setForm({
      name:            e.name            || "",
      description:     e.description     || "",
      startDate:       e.startDate       || "",
      endDate:         e.endDate         || "",
      active:          String(e.active)  || "true",
      discountPercent: String(e.discountPercent || 0),
      productIds:      Array.isArray(e.productIds) ? e.productIds : [],
    });
    setDialogOpen(true);
  };

  const openProductDialog = (e: any) => {
    setSelectedEvent(e);
    setSearchProduct("");
    setProductDialog(true);
  };

  const formatDateTimeLocal = (dateString: string | Date) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    const pad = (n: number) => n.toString().padStart(2, "0");

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = () => {
    const payload = {
      name:            form.name,
      description:     form.description,
      startDate:       form.startDate ? formatDateTimeLocal(new Date(form.startDate).toISOString()) : "",
      endDate:         form.endDate   ? formatDateTimeLocal(new Date(form.endDate).toISOString()) : "",
      active:          form.active === "true",
      discountPercent: Number(form.discountPercent) || 0,
      productIds:      form.productIds,
    };
    if (editEvent) {
      updateMut.mutate({ id: editEvent._id || editEvent.id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sự kiện giảm giá</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Thêm sự kiện</Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sự kiện</TableHead>
                <TableHead className="text-center">Bắt đầu</TableHead>
                <TableHead className="text-center">Kết thúc</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-center">% Giảm</TableHead>
                <TableHead className="text-center">Sản phẩm</TableHead>
                <TableHead className="w-24 text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Đang tải...</TableCell></TableRow>
              ) : eventList.length > 0 ? eventList.map((e: any) => (
                <TableRow key={e._id || e.id}>
                  <TableCell className="font-medium">{e.name || "—"}</TableCell>
                  <TableCell className="text-center text-xs">
                    {e.startDate ? new Date(e.startDate).toLocaleString("vi-VN") : "—"}
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    {e.endDate ? new Date(e.endDate).toLocaleString("vi-VN") : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle(e.active)}`}>
                      {STATUS_LABELS[String(e.active)]}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{e.discountPercent || 0}%</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" onClick={() => openProductDialog(e)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-center">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(e._id || e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Không có sự kiện</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editEvent ? "Sửa sự kiện" : "Thêm sự kiện"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Tên sự kiện" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-muted border-none" />
            <Textarea placeholder="Mô tả" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-muted border-none" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Thời gian bắt đầu</p>
                <Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="bg-muted border-none" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Thời gian kết thúc</p>
                <Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="bg-muted border-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Trạng thái</p>
                <Select value={form.active} onValueChange={(v) => setForm({ ...form, active: v })}>
                  <SelectTrigger className="bg-muted border-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Đang hoạt động</SelectItem>
                    <SelectItem value="false">Không hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">% Giảm giá</p>
                <Input
                  type="number" value={form.discountPercent}
                  min={0}
                  max={50}
                  onFocus={(e) => { if (e.target.value === "0") setForm({ ...form, discountPercent: "" }); }}
                  onBlur={(e)  => { if (e.target.value === "") setForm({ ...form, discountPercent: "0" }); }}
                  onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                  className="bg-muted border-none"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editEvent ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xem & quản lý sản phẩm trong sự kiện */}
      <Dialog open={productDialog} onOpenChange={setProductDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sản phẩm trong sự kiện: {selectedEvent?.name}</DialogTitle>
          </DialogHeader>

          {/* Danh sách SP đang có */}
          <div>
            <p className="text-sm font-medium mb-2">
              Sản phẩm đã thêm ({eventProducts.length}):
            </p>
            {eventProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có sản phẩm nào.</p>
            ) : (
              <div className="space-y-2">
                {eventProducts.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 bg-muted/40 rounded-lg p-3">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-md object-cover flex-shrink-0 border border-border" />
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-muted flex-shrink-0 flex items-center justify-center text-xs text-muted-foreground">N/A</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">₫{item.price?.toLocaleString()} · Tồn: {item.stock}</p>
                    </div>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => removeProductMut.mutate({ eventId: selectedEvent._id || selectedEvent.id, productId: item.id })}
                      disabled={removeProductMut.isPending}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Thêm SP vào sự kiện */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Thêm sản phẩm:</p>
            <Input
              placeholder="Tìm sản phẩm..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="bg-muted border-none mb-3"
            />
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableProducts.slice(0, 20).map((p: any) => {
                const id = p._id || p.id;
                return (
                  <div key={id} className="flex items-center gap-3 bg-muted/20 rounded-lg p-2">
                    {p.urlImages?.[0] ? (
                      <img src={p.urlImages[0]} alt={p.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-1">{p.name}</p>
                      <p className="text-xs text-muted-foreground">₫{p.price?.toLocaleString()}</p>
                    </div>
                    <Button
                      size="sm" variant="outline"
                      onClick={() => addProductMut.mutate({ eventId: selectedEvent._id || selectedEvent.id, productId: id })}
                      disabled={addProductMut.isPending}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Thêm
                    </Button>
                  </div>
                );
              })}
              {availableProducts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Không tìm thấy sản phẩm</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>Bạn có chắc muốn xóa sự kiện này? Thao tác không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMut.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}