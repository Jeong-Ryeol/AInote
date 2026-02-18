export default async function AIChatDetailPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;

  return (
    <div className="p-6">
      <p className="text-muted-foreground">대화 ID: {chatId}</p>
    </div>
  );
}
