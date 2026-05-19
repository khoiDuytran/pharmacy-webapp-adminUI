import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Search } from "lucide-react";
import { billApi, productsApi } from "@/lib/api";
import { Input } from "@/components/ui/input";

const STATUS_TABS = ["all", 0, 1, 2, 3, 4, 5];

const STATUS_LABELS: Record<number | string, string> = {
  all: "Tất cả",
  0: "Chờ xác nhận",
  1: "Đã xác nhận",
  2: "Đang giao",
  3: "Đã giao",
  4: "Đã hủy",
  5: "Hoàn hàng",
};

const PAYMENT_LABELS: Record<number, string> = {
  1: "COD",
  2: "VNPay",
};

const PAYMENT_STATUS_LABELS: Record<number, string> = {
  0: "Chưa thanh toán",
  1: "Đã thanh toán",
  2: "Thanh toán thất bại",
  3: "Đã hoàn tiền",
  4: "Hủy bỏ thanh toán",
};

// orderStatus + paymentMethod → paymentStatus tương ứng
const getPaymentStatus = (orderStatus: number, paymentMethod: number): number => {
  if (orderStatus === 5) return 3;      // hoàn hàng → đã hoàn tiền
  if (paymentMethod === 2) return 1;    // VNPay → luôn đã thanh toán
  if (orderStatus === 3) return 1;      // COD đã giao → đã thanh toán
  return 0;                             // COD chưa giao → chưa thanh toán
};

export default function Orders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: ordersRes, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => billApi.getAll(),
  });

  const { data: productsRes } = useQuery({
    queryKey: ["products"],
    queryFn: () => productsApi.getAll(),
  });

  const orderList = Array.isArray(ordersRes) ? ordersRes : [];
  // Lọc bỏ đơn VNPay chưa thanh toán hoặc thất bại
  const orders = orderList.filter(
    (o) => !(o.paymentMethod === 2 && (o.paymentStatus === 0 || o.paymentStatus === 2)),
  );
  const productList = Array.isArray(productsRes) ? productsRes : [];

  // Join products vào order đang xem
  const orderProducts = selectedOrder?.products
    ? Object.entries(selectedOrder.products).map(([productId, qty]: [string, any]) => {
        const detail = productList.find((p: any) => p._id === productId || p.id === productId);
        const price = detail?.price || 0;
        const discount = detail?.percentDiscount || 0;
        return {
          id: productId,
          quantity: qty,
          name: detail?.name || productId.slice(-8),
          image: detail?.urlImages?.[0] || detail?.images?.[0] || "",
          price,
          discount,
          discountedPrice: price * (1 - discount / 100),
        };
      })
    : [];

  const updateStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: number }) => {
      const paymentMethod = selectedOrder?.paymentMethod;
      const paymentStatus = getPaymentStatus(status, paymentMethod);

      await billApi.updatePaymentStatus(id, paymentStatus);
      await billApi.updateStatus(id, status);

      // Trả về để dùng trong onSuccess
      return { status, paymentStatus };
    },
    onSuccess: ({ status, paymentStatus }) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      // Cập nhật selectedOrder sau khi BE confirm
      setSelectedOrder((prev: any) => ({
        ...prev,
        oderStatus: status,
        paymentStatus,
      }));
      toast({ title: "Đã cập nhật trạng thái" });
    },
    onError: (e: any) =>
      toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const statusStyle = (s: number) => {
    const m: Record<number, string> = {
      0: "bg-stat-yellow/15 text-stat-yellow",
      1: "bg-stat-purple/15 text-stat-purple",
      2: "bg-stat-blue/15 text-stat-blue",
      3: "bg-stat-green/15 text-stat-green",
      4: "bg-stat-red/15 text-stat-red",
      5: "bg-stat-pink/15 text-stat-pink",
    };
    return m[s] || "bg-muted text-muted-foreground";
  };

  const paymentStatusStyle = (s: number) => {
    const m: Record<number, string> = {
      0: "bg-stat-blue/15 text-stat-blue",
      1: "bg-stat-green/15 text-stat-green",
      2: "bg-stat-red/15 text-stat-red",
      3: "bg-stat-blue/15 text-stat-blue",
      4: "bg-stat-red/15 text-stat-red",
    };
    return m[s] || "bg-muted text-muted-foreground";
  };

  const filterOrders = [...orders]
    .reverse()
    .filter((o: any) => {
      const id = o._id || o.id || "";
      const matchSearch = id.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" || o.oderStatus === Number(statusFilter);
      return matchSearch && matchStatus;
    });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Đơn hàng</h1>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="bg-muted">
          {STATUS_TABS.map((s) => (
            <TabsTrigger key={String(s)} value={String(s)}>
              {STATUS_LABELS[s]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm đơn hàng.."
              className="pl-9 bg-muted border-none max-w-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead className="hidden md:table-cell">Ngày</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-20">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : filterOrders.length > 0 ? (
                filterOrders.map((o: any) => (
                  <TableRow key={o._id || o.id}>
                    <TableCell className="font-mono text-xs">
                      {(o._id || o.id)?.slice(-8)}
                    </TableCell>
                    <TableCell>{o.shippingAddress?.recipientName || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString("vi-VN") : "—"}
                    </TableCell>
                    <TableCell>₫{o.totalAmount?.toLocaleString() || "0"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle(o.oderStatus)}`}>
                        {STATUS_LABELS[o.oderStatus]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(o)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Không có đơn hàng
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog chi tiết */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-5">

              {/* Thông tin đơn */}
              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/40 rounded-lg p-4">
                <div>
                  <span className="text-muted-foreground">Mã đơn: </span>
                  <span className="font-mono font-medium">
                    #{(selectedOrder._id || selectedOrder.id)?.slice(-8)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Trạng thái: </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle(selectedOrder.oderStatus)}`}>
                    {STATUS_LABELS[selectedOrder.oderStatus]}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Khách hàng: </span>
                  <span>{selectedOrder.shippingAddress?.recipientName || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">SĐT: </span>
                  <span>{selectedOrder.shippingAddress?.numPhone || "—"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Địa chỉ: </span>
                  <span>
                    {[
                      selectedOrder.shippingAddress?.addressLine,
                      selectedOrder.shippingAddress?.district,
                      selectedOrder.shippingAddress?.city,
                    ].filter(Boolean).join(", ") || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ngày tạo: </span>
                  <span>
                    {selectedOrder.createdAt
                      ? new Date(selectedOrder.createdAt).toLocaleString("vi-VN")
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ngày cập nhật: </span>
                  <span>
                    {selectedOrder.updatedAt
                      ? new Date(selectedOrder.updatedAt).toLocaleString("vi-VN")
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Thanh toán: </span>
                  <span>{PAYMENT_LABELS[selectedOrder.paymentMethod] || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tổng tiền: </span>
                  <span className="font-semibold text-red-500">
                    ₫{selectedOrder.totalAmount?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Trạng thái thanh toán */}
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Trạng thái thanh toán:</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatusStyle(selectedOrder.paymentStatus)}`}>
                  {PAYMENT_STATUS_LABELS[selectedOrder.paymentStatus] || "—"}
                </span>
              </div>

              {/* Cập nhật trạng thái đơn */}
              <div>
                <p className="text-sm font-medium mb-2">Cập nhật trạng thái:</p>
                <Select
                  value={String(selectedOrder.oderStatus)}
                  disabled={updateStatusMut.isPending}
                  onValueChange={(v) => {
                    const newStatus = Number(v);
                    updateStatusMut.mutate({
                      id: selectedOrder._id || selectedOrder.id,
                      status: newStatus,
                    });
                  }}
                >
                  <SelectTrigger className="bg-muted border-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_TABS.filter((s) => s !== "all").map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {updateStatusMut.isPending && (
                  <p className="text-xs text-muted-foreground mt-1">Đang cập nhật...</p>
                )}
              </div>

              {/* Danh sách sản phẩm */}
              {orderProducts.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-3">
                    Sản phẩm ({orderProducts.length}):
                  </p>
                  <div className="space-y-3">
                    {orderProducts.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 bg-muted/40 rounded-lg p-3"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-14 h-14 rounded-md object-cover flex-shrink-0 border border-border"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-md bg-muted flex-shrink-0 flex items-center justify-center text-muted-foreground text-xs">
                            N/A
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {item.discount > 0 && (
                              <span className="text-xs text-muted-foreground line-through">
                                ₫{item.price.toLocaleString()}
                              </span>
                            )}
                            <span className="text-sm font-semibold text-red-500">
                              ₫{item.discountedPrice.toLocaleString()}
                            </span>
                            {item.discount > 0 && (
                              <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">
                                -{item.discount}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                          <p className="text-sm font-semibold">
                            ₫{(item.discountedPrice * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}