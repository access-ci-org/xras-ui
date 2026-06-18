import { createFormHook, type AppFieldExtendedReactFormApi } from "@tanstack/react-form";

import { fieldContext, formContext } from "./context";
import {
  FieldDatePicker,
  FieldInput,
  FieldSelect,
  FieldTextarea,
  FieldRadio,
} from "./fields";
import { SubscribeButton } from "./subscribe-button";

const fieldComponents = {
  FieldInput,
  FieldTextarea,
  FieldSelect,
  FieldDatePicker,
  FieldRadio,
};

const formComponents = {
  SubscribeButton,
};

export const { useAppForm, withForm } = createFormHook({
  fieldComponents,
  formComponents,
  fieldContext,
  formContext,
});

export type AppForm<TFormData> = AppFieldExtendedReactFormApi<
  TFormData,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  typeof fieldComponents,
  typeof formComponents
>;
