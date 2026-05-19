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
import { categoriesApi } from "@/lib/api";

export default function Categories() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editCat, setEditCat] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: categoriesRes, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getAll,
  });

  const categories = Array.isArray(categoriesRes) ? categoriesRes : [];

  const createMut = useMutation({
    mutationFn: (data: any) => categoriesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); toast({ title: "Đã thêm danh mục" }); setDialogOpen(false); },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => categoriesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); toast({ title: "Đã cập nhật" }); setDialogOpen(false); setEditCat(null); },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); toast({ title: "Đã xóa danh mục" }); setDeleteId(null); },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => { setEditCat(null); setForm({ name: "", description: "" }); setDialogOpen(true); };
  const openEdit = (c: any) => { setEditCat(c); setForm({ name: c.name || "", description: c.description || "" }); setDialogOpen(true); };

  const handleSubmit = () => {
    if (editCat) {
      updateMut.mutate({ id: editCat._id || editCat.id, data: form });
    } else {
      createMut.mutate(form);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Danh mục</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Thêm danh mục</Button>
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
              ) : categories.length > 0 ? categories.map((c: any) => (
                <TableRow key={c._id || c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{c.description || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(c._id || c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCat ? "Sửa danh mục" : "Thêm danh mục"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Tên danh mục" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-muted border-none" />
            <Input placeholder="Mô tả" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-muted border-none" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editCat ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>Bạn có chắc muốn xóa danh mục này?</AlertDialogDescription>
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
