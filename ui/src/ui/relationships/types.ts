import type { ComponentType } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { GraphEdge } from "../../domain/types";
import type { RelationshipDefinition } from "@compiler/catalog.ts";

import type { FormValues } from "../services/types";

export type EdgeConfigFieldsProps = {
  formId: string;
  edge: GraphEdge;
  rel: RelationshipDefinition;
  form: UseFormReturn<FormValues>;
};

export type UiRelationshipModule = {
  EdgeConfigFields: ComponentType<EdgeConfigFieldsProps>;
};
