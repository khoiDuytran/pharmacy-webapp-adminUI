import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usersApi } from "@/lib/api";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const { data: usersRes, isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: () => usersApi.getAll(),
  });

  const users = Array.isArray(usersRes) ? usersRes : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Khách hàng</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm khách hàng..." className="pl-9 bg-muted border-none max-w-sm" value={search} onChange={(e) => { setSearch(e.target.value); }} />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Điện thoại</TableHead>
                <TableHead className="hidden md:table-cell">Ngày sinh</TableHead>
                <TableHead className="w-20">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Đang tải...</TableCell></TableRow>
              ) : users.length > 0 ? users.map((u: any) => (
                <TableRow key={u._id || u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{u.username}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{u.phoneNumber || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{u.birthDate ? u.birthDate : "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setSelected(u)}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Không có khách hàng</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết khách hàng</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/20 text-primary">{selected.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-base">{selected.username}</p>
                  <p className="text-muted-foreground">{selected.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Điện thoại:</span> {selected.phoneNumber || "—"}</div>
                <div><span className="text-muted-foreground">Ngày sinh:</span> {selected.birthDate ? selected.birthDate : "—"}</div>
                <div><span className="text-muted-foreground">Vai trò:</span> {selected.role || "user"}</div>
                <div><span className="text-muted-foreground">Giới tính:</span> {selected.gender || "—"}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
