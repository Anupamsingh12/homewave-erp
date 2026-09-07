import { Mail, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickContactLinks({ phone, email }: { phone: string; email: string }) {
  const digits = phone.replace(/\D/g, "");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <a href={`tel:+91${digits}`}>
          <Phone className="size-4" /> Call
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={`https://wa.me/91${digits}`} target="_blank" rel="noreferrer">
          <MessageCircle className="size-4" /> WhatsApp
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={`mailto:${email}`}>
          <Mail className="size-4" /> Email
        </a>
      </Button>
    </div>
  );
}
