import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cài đặt</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cài đặt chung</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chức năng cài đặt sẽ được cập nhật sau.</p>
        </CardContent>
      </Card>
    </div>
  );
}
