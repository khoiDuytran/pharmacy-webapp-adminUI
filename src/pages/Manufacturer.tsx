import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { manufacturerApi } from "@/lib/api";

export default function Manufacturer() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editManu, setEditManu] = useState<any>(null);
  const [form, setForm] = useState<{ 
    name: string; description: string; image: File | null; previewUrl: string 
  }>({ name: "", description: "", image: null, previewUrl: "" });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: manufacturerRes, isLoading } = useQuery({
    queryKey: ["manufacturer"],
    queryFn: manufacturerApi.getAll,
  });

  const manufacturers = Array.isArray(manufacturerRes) ? manufacturerRes : [];

  const createMut = useMutation({
    mutationFn: (data: any) => manufacturerApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["manufacturer"] }); toast({ title: "Đã thêm nhà cung cấp" }); setDialogOpen(false); },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => manufacturerApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["manufacturer"] }); toast({ title: "Đã cập nhật" }); setDialogOpen(false); setEditManu(null); },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => manufacturerApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["manufacturer"] }); toast({ title: "Đã xóa danh mục" }); setDeleteId(null); },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => { setEditManu(null); setForm({ name: "", description: "", image: null, previewUrl: "" }); setDialogOpen(true); };
  const openEdit = (m: any) => { setEditManu(m); setForm({ name: m.name || "", description: m.description || "", image: null, previewUrl: m.urlImage || "" }); console.log(form); setDialogOpen(true); };

  const handleAddImage = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    const previewUrl = URL.createObjectURL(file);

    setForm((prev) => ({
      ...prev,
      image: file,
      previewUrl
    }));
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({
      ...prev,
      image: null,
      previewUrl: "",
    }));
  };

  const handleSubmit = () => {
    const payload = { name: form.name, description: form.description, image: form.image}
    console.log(payload);
    if (editManu) {
      updateMut.mutate({ id: editManu.id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nhà Cung Cấp</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Thêm NCC</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên danh mục</TableHead>
                <TableHead className="hidden md:table-cell">Mô tả</TableHead>
                <TableHead className="w-24">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Đang tải...</TableCell></TableRow>
              ) : manufacturers.length > 0 ? manufacturers.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {m.urlImage && <img src={m.urlImage} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                      <div>
                        <p className="font-medium">{m.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{m.description || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Không có danh mục</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editManu ? "Sửa danh mục" : "Thêm danh mục"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Tên NCC" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-muted border-none" />
            <Input placeholder="Mô tả" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-muted border-none" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Hình ảnh NCC</p>

            <div className="flex flex-wrap gap-3">

              {/* Image Preview */}
              {form.previewUrl && (
                <div className="relative w-24 h-24">
                  <img
                    src={form.previewUrl}
                    alt=""
                    className="w-full h-full object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 text-xs"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Add Image Button */}
              {!form.previewUrl && (
                <label className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted">
                  <span className="text-sm text-muted-foreground">+ Thêm ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      handleAddImage(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}

            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editManu ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>Bạn có chắc muốn xóa NCC này?</AlertDialogDescription>
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
