import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Contract } from "@/types/contract";

const contractSchema = z.object({
  contractor: z
    .string()
    .trim()
    .min(3, { message: "نام پیمانکار باید حداقل ۳ کاراکتر باشد" })
    .max(100, { message: "نام پیمانکار نباید بیشتر از ۱۰۰ کاراکتر باشد" }),
  description: z
    .string()
    .trim()
    .min(10, { message: "شرح عملیات باید حداقل ۱۰ کاراکتر باشد" })
    .max(500, { message: "شرح عملیات نباید بیشتر از ۵۰۰ کاراکتر باشد" }),
  permitStage: z.string().min(1, { message: "مرحله مجوز را انتخاب کنید" }),
  documentStatus: z
    .string()
    .min(1, { message: "وضعیت اسناد را انتخاب کنید" }),
  estimate: z
    .string()
    .min(1, { message: "برآورد اولیه الزامی است" })
    .refine(
      (val) => {
        const num = Number(val.replace(/,/g, ""));
        return !isNaN(num) && num >= 0;
      },
      { message: "برآورد باید یک عدد معتبر باشد" }
    ),
});

type ContractFormData = z.infer<typeof contractSchema>;

interface ContractFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: Contract | null;
  onSubmit: (data: Omit<Contract, "id"> & { id?: number }) => void;
}

const permitStageOptions = [
  "صدور - لغو شده",
  "عدم صدور - لغو شده",
  "در انتظار صدور",
  "صادر شده",
  "صدور - تایید نهایی",
  "صدور - امضا اولیه",
  "صدور - در انتظار امضا",
  "عدم صدور",
];

const documentStatusOptions = [
  "در حال تهیه پیش نویس",
  "پیش نویس به حقوقی",
  "پیش نویس به موسسه",
  "انجام در موسسه",
  "بازگشت",
  "بازگشت از موسسه",
  "تایید شده",
  "تایید و بازگشت از موسسه",
  "بازگشت از حقوقی کارگاه",
];

export function ContractForm({
  open,
  onOpenChange,
  contract,
  onSubmit,
}: ContractFormProps) {
  const isEditing = !!contract;

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      contractor: "",
      description: "",
      permitStage: "",
      documentStatus: "",
      estimate: "",
    },
  });

  // وقتی contract تغییر کند، مقادیر فرم را ریست کن
  useEffect(() => {
    if (contract) {
      form.reset({
        contractor: contract.contractor || "",
        description: contract.description || "",
        permitStage: contract.permitStage || "",
        documentStatus: contract.documentStatus || "",
        estimate: contract.estimate?.toString() || "",
      });
    } else {
      form.reset({
        contractor: "",
        description: "",
        permitStage: "",
        documentStatus: "",
        estimate: "",
      });
    }
  }, [contract, form]);

  const handleSubmit = (data: ContractFormData) => {
    const estimate = Number(data.estimate.replace(/,/g, ""));
    onSubmit({
      ...(contract?.id ? { id: contract.id } : {}),
      contractor: data.contractor,
      description: data.description,
      permitStage: data.permitStage,
      documentStatus: data.documentStatus,
      estimate,
    });
    form.reset();
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground text-right">
            {isEditing ? "ویرایش قرارداد" : "افزودن قرارداد جدید"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            <FormField
              control={form.control}
              name="contractor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">نام پیمانکار</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="نام شرکت یا پیمانکار را وارد کنید"
                      className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">شرح عملیات</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="توضیحات مربوط به قرارداد را وارد کنید"
                      className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="permitStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">مرحله مجوز</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-secondary/50 border-border text-foreground">
                          <SelectValue placeholder="انتخاب کنید" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-border">
                        {permitStageOptions.map((option) => (
                          <SelectItem
                            key={option}
                            value={option}
                            className="text-foreground hover:bg-secondary"
                          >
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">وضعیت اسناد</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-secondary/50 border-border text-foreground">
                          <SelectValue placeholder="انتخاب کنید" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-border">
                        {documentStatusOptions.map((option) => (
                          <SelectItem
                            key={option}
                            value={option}
                            className="text-foreground hover:bg-secondary"
                          >
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="estimate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    برآورد اولیه (ریال)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="مبلغ برآورد را وارد کنید"
                      className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" variant="gradient" className="flex-1">
                {isEditing ? "ذخیره تغییرات" : "افزودن قرارداد"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleOpenChange(false)}
              >
                انصراف
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
