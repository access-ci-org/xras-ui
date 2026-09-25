import { useAppForm } from "@/components/form";
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_TABLE,
  ADMIN_TD,
  ADMIN_TH,
} from "../shared/adminTheme";
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
    <table className={ADMIN_TABLE}>
      <thead>
        <tr>
          <th className={ADMIN_TH}>Keyword</th>
          <th className={ADMIN_TH}>Allocation Type</th>
          <td className="p-2"></td>
        </tr>
      </thead>
      <tbody>
        <tr>
          {/* Bootstrap 2 predates `box-sizing: border-box`, so the widths this
              app's markup puts on a cell size its content box. */}
          <td className={`box-content w-[150px] ${ADMIN_TD}`}>
            <KeywordInputField form={form} />
          </td>
          <td className={ADMIN_TD}>
            <AllocationTypeCheckboxes
              form={form}
              types={types}
              idPrefix="create_keyword"
              inline
              selectAll
            />
          </td>
          <td className={`box-content w-[50px] ${ADMIN_TD}`}>
            <button
              type="button"
              className={ADMIN_BTN_PRIMARY}
              onClick={() => form.handleSubmit()}
            >
              Add
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default AddKeyword;
