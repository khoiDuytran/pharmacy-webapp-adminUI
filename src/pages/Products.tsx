import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { categoriesApi, manufacturerApi, productsApi } from "@/lib/api";

export default function Products() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [manuFilter, setManuFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [form, setForm] = useState({ 
    manufacturerId: "",
    categoriesId: "",
    name: "", 
    description: "", 
    originalPrice: "0", 
    price: "0", 
    quantity: "0",
    purchaseCount: "0",
    percentDiscount: "0",
    images: [] as File[],
    previewUrls: [] as string[],
  });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: productsRes, isLoading } = useQuery({
    queryKey: ["product"],
    queryFn: productsApi.getAll,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getAll,
  });

  const { data: manufacturer } = useQuery({
    queryKey: ["manufacturer"],
    queryFn: manufacturerApi.getAll,
  })

  const products = Array.isArray(productsRes) ? productsRes : [];
  const catList = Array.isArray(categories) ? categories : [];
  const manuList = Array.isArray(manufacturer) ? manufacturer : [];

  const createMut = useMutation({
    mutationFn: (data: any) => productsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["product"] }); toast({ title: "Đã thêm sản phẩm" }); setDialogOpen(false); },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => productsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["product"] }); toast({ title: "Đã cập nhật" }); setDialogOpen(false); setEditProduct(null); },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["product"] }); toast({ title: "Đã xóa sản phẩm" }); setDeleteId(null); },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const stockCount = (p) => {
    return p.quantity - p.purchaseCount;
  }

  const openCreate = () => {
    setEditProduct(null);
    setForm({ manufacturerId: "", categoriesId: "", name: "", description: "", originalPrice: "0", price: "0", quantity: "0", purchaseCount: "0", percentDiscount: "0", images: [], previewUrls: [] });
    setDialogOpen(true);
  };

  const filteredProducts = products.filter((p: any) => {
    const matchSearch = p.name
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchCategory = catFilter
      ? p.categories?.name === catFilter
      : true;

    const matchManufacturer = manuFilter
      ? p.manufacturer?.name === manuFilter
      : true;

    return matchSearch && matchCategory && matchManufacturer;
  });

  const openEdit = (p: any) => {
    setEditProduct(p);
    setForm({
      manufacturerId: p.manufacturer?.id || "",
      categoriesId: p.categories?.id || "",
      name: p.name || "",
      description: p.description || "",
      originalPrice: String(p.originalPrice || "0"),
      price: String(p.price || "0"),
      quantity: String(p.quantity || "0"),
      purchaseCount: String(p.purchaseCount || "0"),
      percentDiscount: String(p.percentDiscount || "0"),
      images: [],
      previewUrls: Array.isArray(p.urlImages) ? p.urlImages : [],
    });
    setDialogOpen(true);
  };

  const handleAddImages = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...newFiles],
      previewUrls: [...prev.previewUrls, ...newPreviews],
    }));
  };

  const handleRemoveImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      previewUrls: prev.previewUrls.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    const percentDiscount = Number(form.percentDiscount) || 0;
    
    if (percentDiscount < 0 || percentDiscount > 50) {
      toast({ title: "Lỗi", description: "% giảm giá phải từ 0 đến 50", variant: "destructive" });
      return;
    }

    const data = {
      manufacturerId: form.manufacturerId,
      categoriesId: form.categoriesId,
      name: form.name,
      description: form.description,
      originalPrice: Number(form.originalPrice) || 0,
      price: Number(form.price) || 0,
      percentDiscount: percentDiscount || 0,
      quantity: Number(form.quantity) || 0,
      purchaseCount: Number(form.purchaseCount) || 0,
      images: form.images,
    };
    if (editProduct) {
      updateMut.mutate({ id: editProduct.id, data });
    } else {
      createMut.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sản phẩm</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Thêm sản phẩm</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm sản phẩm..." className="pl-9 bg-muted border-none" value={search} onChange={(e) => { setSearch(e.target.value); }} />
            </div>
            <Select value={catFilter} onValueChange={(v) => { setCatFilter(v === "all" ? "" : v); }}>
              <SelectTrigger className="w-48 bg-muted border-none"><SelectValue placeholder="Danh mục" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {catList.map((c: any) => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={manuFilter} onValueChange={(v) => { setManuFilter(v === "all" ? "" : v); }}>
              <SelectTrigger className="w-48 bg-muted border-none"><SelectValue placeholder="Nhà cung cấp" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {manuList.map((m: any) => (
                  <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead className="hidden md:table-cell text-center">Danh mục</TableHead>
                <TableHead className="hidden md:table-cell text-center">NCC</TableHead>
                <TableHead className="text-center">Giá nhập</TableHead>
                <TableHead className="text-center">Giá bán</TableHead>
                <TableHead className="text-center">% Giảm giá</TableHead>
                <TableHead className="text-center">Tồn kho</TableHead>
                <TableHead className="w-24 text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-center">
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Đang tải...</TableCell></TableRow>
              ) : filteredProducts.length > 0 ? filteredProducts.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 mr-3">
                      {p.urlImages && <img src={p.urlImages[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{p.categories?.name || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{p.manufacturer?.name || "—"}</TableCell>
                  <TableCell>{p.originalPrice?.toLocaleString()}₫</TableCell>
                  <TableCell>{p.price?.toLocaleString()}₫</TableCell>
                  <TableCell>{p.percentDiscount || "—"}%</TableCell>
                  <TableCell>{stockCount(p)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Không có sản phẩm</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Tên sản phẩm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-muted border-none" />
            <Textarea placeholder="Mô tả" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-muted border-none" />
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Giá nhập (₫)</p>
                <Input type="number" placeholder="Giá nhập" value={form.originalPrice} onFocus={(e) => { if (e.target.value === "0") setForm({ ...form, originalPrice: ""}); }} onBlur={(e) => { if (e.target.value === "") setForm({ ...form, originalPrice: "0"}); }} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} className="bg-muted border-none" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Giá bán(₫)</p>
                <Input type="number" placeholder="Giá bán" value={form.price} onFocus={(e) => { if (e.target.value === "0") setForm({ ...form, price: "" }); }} onBlur={(e) => { if (e.target.value === "") setForm({ ...form, price: "0" }); }} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-muted border-none" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">% Giảm giá</p>
                <Input 
                  type="number" 
                  placeholder="% Giảm giá" 
                  min="0"
                  max="50"
                  value={form.percentDiscount} 
                  onFocus={(e) => { if (e.target.value === "0") setForm({ ...form, percentDiscount: "" }); }} 
                  onBlur={(e) => { if (e.target.value === "") setForm({ ...form, percentDiscount: "0" }); }} 
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setForm({ ...form, percentDiscount: "" });
                    } else {
                      const num = Number(value);
                      if (num >= 0 && num <= 50) {
                        setForm({ ...form, percentDiscount: value });
                      }
                    }
                  }} 
                  className="bg-muted border-none" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Tồn kho</p>
                <Input type="number" placeholder="Tồn kho" value={form.quantity} onFocus={(e) => { if (e.target.value === "0") setForm({ ...form, quantity: "" }); }} onBlur={(e) => { if (e.target.value === "") setForm({ ...form, quantity: "0" }); }} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="bg-muted border-none" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Đã bán</p>
                <Input type="number" placeholder="Đã bán" value={form.purchaseCount} onFocus={(e) => { if (e.target.value === "0") setForm({ ...form, purchaseCount: "" }); }} onBlur={(e) => { if (e.target.value === "") setForm({ ...form, purchaseCount: "0" }); }} onChange={(e) => setForm({ ...form, purchaseCount: e.target.value })} className="bg-muted border-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Select value={form.categoriesId} onValueChange={(v) => setForm({ ...form, categoriesId: v })}>
                  <SelectTrigger className="bg-muted border-none"><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                  <SelectContent>
                    {catList.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Select value={form.manufacturerId} onValueChange={(v) => setForm({ ...form, manufacturerId: v })}>
                  <SelectTrigger className="bg-muted border-none"><SelectValue placeholder="Chọn nhà cung cấp" /></SelectTrigger>
                  <SelectContent>
                    {manuList.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
              </Select>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Hình ảnh sản phẩm</p>

              <div className="flex flex-wrap gap-3">
                {form.previewUrls.map((img, index) => (
                  <div key={index} className="relative w-24 h-24">
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}

                <label className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted">
                  <span className="text-sm text-muted-foreground">+ Thêm ảnh</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleAddImages(e.target.files)}
                  />
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editProduct ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>Bạn có chắc muốn xóa sản phẩm này? Thao tác không thể hoàn tác.</AlertDialogDescription>
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