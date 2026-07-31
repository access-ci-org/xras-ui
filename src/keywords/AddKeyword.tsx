import { useAppForm } from "@/components/form";
import { Button } from "@/components/ui/button";
import { AllocationTypeCheckboxes, KeywordInputField } from "./KeywordFields";
import type { AllocationType } from "./types";

type AddKeywordProps = {
  types: AllocationType[];
  createData: (keywordValues: string, keywordTypes: number[]) => Promise<void>;
};

const AddKeyword = ({ types, createData }: AddKeywordProps) => {
  const form = useAppForm({
    defaultValues: { keyword: "", allocationTypeIds: [] as number[] },
    onSubmit: async ({ value }) => {
      await createData(value.keyword, value.allocationTypeIds);
      form.reset();
    },
  });

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b">
          <th className="p-2 text-left">Keyword</th>
          <th className="p-2 text-left">Allocation Type</th>
          <td></td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="w-[150px] p-2 align-top">
            <KeywordInputField form={form} />
          </td>
          <td className="p-2 align-top">
            <AllocationTypeCheckboxes form={form} types={types} idPrefix="create_keyword" />
          </td>
          <td className="w-[50px] p-2 align-top">
            <Button type="button" onClick={() => form.handleSubmit()}>
              Add
            </Button>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default AddKeyword;
