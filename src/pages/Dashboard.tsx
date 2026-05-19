import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Package, Users, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { billApi, productsApi, usersApi } from "@/lib/api";

const PIE_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(152, 69%, 53%)",
  "hsl(340, 82%, 62%)",
  "hsl(45, 93%, 58%)",
  "hsl(262, 83%, 58%)",
  "hsl(180, 70%, 50%)",
];

const STATUS_LABELS: Record<number, string> = {
  0: "Chờ xác nhận",
  1: "Đã xác nhận",
  2: "Đang giao",
  3: "Đã giao",
  4: "Đã hủy",
  5: "Hoàn hàng",
};

const STATUS_STYLES: Record<number, string> = {
  0: "bg-stat-yellow/15 text-stat-yellow",
  1: "bg-stat-orange/15 text-stat-orange",
  2: "bg-stat-blue/15 text-stat-blue",
  3: "bg-stat-green/15 text-stat-green",
  4: "bg-stat-red/15 text-stat-red",
  5: "bg-stat-pink/15 text-stat-pink",
};

export default function Dashboard() {
  const { data: ordersRaw, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => billApi.getAll(),
  });

  const { data: productsRaw, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => productsApi.getAll(),
  });

  const { data: usersRaw, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.getAll(),
  });

  const isLoading = ordersLoading || productsLoading || usersLoading;

  const orders: any[] = Array.isArray(ordersRaw) ? ordersRaw : [];
  const products: any[] = Array.isArray(productsRaw) ? productsRaw : [];
  const users: any[] = Array.isArray(usersRaw) ? usersRaw : [];

  // Tổng doanh thu = tổng tất cả đơn đã giao (orderStatus === 3)
  const deliveredOrders = orders.filter((o) => o.oderStatus === 3);
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  //Tổng lợi nhuận
  const productMap = new Map(products.map((p: any) => [p._id || p.id, p]));

  const totalProfit = deliveredOrders.reduce((sum, o) => {
    if (!o.products) return sum;

    const totalOriginalPrice = Object.entries(o.products).reduce(
      (acc, [productId, qty]: [string, any]) => {
        const product = productMap.get(productId);
        if (!product) return acc;

        const total = (product.originalPrice || 0) * qty;

        return acc + total;
      },
      0,
    );

    const orderProfit = o.totalAmount - totalOriginalPrice;
    console.log(orderProfit, o.totalAmount);

    return sum + orderProfit;
  }, 0)

  const statCards = [
    { title: "Tổng doanh thu", icon: DollarSign, color: "bg-stat-green/15 text-stat-green", value: `₫${totalRevenue.toLocaleString()}` },
    { title: "Lợi nhuận", icon: TrendingUp, color: "bg-stat-green/15 text-stat-green", value: `₫${totalProfit.toLocaleString()}` },
    { title: "Tổng đơn hàng", icon: ShoppingCart, color: "bg-stat-pink/15 text-stat-pink", value: orders.length },
    { title: "Sản phẩm", icon: Package, color: "bg-stat-blue/15 text-stat-blue", value: products.length },
    { title: "Khách hàng", icon: Users, color: "bg-stat-yellow/15 text-stat-yellow", value: users.length },
  ];

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const revenueByMonth: Record<string, number> = {};
  deliveredOrders
    .filter((o) => o.createdAt)
    .forEach((o) => {
      const d = new Date(o.createdAt);
      const key = `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      revenueByMonth[key] = (revenueByMonth[key] || 0) + (o.totalAmount || 0);
    });
  const revenueData = Object.entries(revenueByMonth)
    .sort((a, b) => {
      const [am, ay] = a[0].split("/").map(Number);
      const [bm, by] = b[0].split("/").map(Number);
      return ay !== by ? ay - by : am - bm;
    })
    .slice(-8)
    .map(([month, revenue]) => ({ month, revenue }));

  const statusCount: Record<number, number> = {};
  orders.forEach((o) => {
    statusCount[o.oderStatus] = (statusCount[o.oderStatus] || 0) + 1;
  });
  const pieData = Object.entries(statusCount).map(([status, count]) => ({
    name: STATUS_LABELS[Number(status)] || `Trạng thái ${status}`,
    value: count,
  }));

  const bestSelling = [...products]
    .sort((a, b) => (b.purchaseCount || b.sold || 0) - (a.purchaseCount || a.sold || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                  )}
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${card.color}`}>
                  <card.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Doanh thu theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 15%, 25%)" />
                    <XAxis dataKey="month" stroke="hsl(215, 20%, 60%)" fontSize={11} />
                    <YAxis
                      stroke="hsl(215, 20%, 60%)"
                      fontSize={11}
                      tickFormatter={(v) =>
                        v >= 1_000_000
                          ? `${(v / 1_000_000).toFixed(0)}M`
                          : v >= 1_000
                          ? `${(v / 1_000).toFixed(0)}K`
                          : String(v)
                      }
                    />
                    <Tooltip
                      formatter={(value: number) => [`₫${value.toLocaleString()}`, "Doanh thu"]}
                      contentStyle={{
                        background: "hsl(228, 25%, 18%)",
                        border: "1px solid hsl(228, 15%, 25%)",
                        borderRadius: "8px",
                        color: "hsl(210, 40%, 95%)",
                      }}
                    />
                    <Bar dataKey="revenue" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Chưa có dữ liệu doanh thu
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pie chart: tỉ lệ đơn theo trạng thái */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tỉ lệ đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex flex-col items-center justify-center">
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="70%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        dataKey="value"
                        paddingAngle={4}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [value, name]}
                        contentStyle={{
                          background: "hsl(228, 25%, 18%)",
                          border: "1px solid hsl(228, 15%, 25%)",
                          borderRadius: "8px",
                          color: "hsl(210, 40%, 95%)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                    {pieData.map((entry, i) => (
                      <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span
                          className="h-2 w-2 rounded-full inline-block flex-shrink-0"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        {entry.name} ({entry.value})
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground text-sm">Chưa có dữ liệu</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Đơn hàng gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Đang tải...</TableCell>
                </TableRow>
              ) : recentOrders.length > 0 ? recentOrders.map((order: any) => (
                <TableRow key={order._id || order.id}>
                  <TableCell className="font-mono text-xs">{(order._id || order.id)?.slice(-8)}</TableCell>
                  <TableCell>{order.shippingAddress?.recipientName || order.user?.name || "—"}</TableCell>
                  <TableCell>{order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "—"}</TableCell>
                  <TableCell>₫{order.totalAmount?.toLocaleString() || "0"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[order.orderStatus] || "bg-muted text-muted-foreground"}`}>
                      {STATUS_LABELS[order.oderStatus] || "—"}
                    </span>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Chưa có dữ liệu</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Best Selling */}
      {bestSelling.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sản phẩm bán chạy</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Đã bán</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bestSelling.map((p: any) => (
                  <TableRow key={p._id || p.id}>
                    <TableCell className="flex items-center gap-3">
                      {p.images?.[0] && <img src={p.images[0]} alt="" className="h-8 w-8 rounded object-cover" />}
                      <span>{p.name}</span>
                    </TableCell>
                    <TableCell>₫{p.price?.toLocaleString()}</TableCell>
                    <TableCell>{p.purchaseCount || p.sold || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}