import type { ComponentType } from "react";
import type { Control, FieldErrors, UseFormReturn } from "react-hook-form";

import type { GraphNode } from "../../domain/types";
import type { ServiceDefinition } from "@compiler/catalog.ts";

export type FormValues = Record<string, unknown>;

export type CanvasNodeProps = {
  data: { title: string; serviceDisplayName: string };
  selected?: boolean;
};

export type CanvasNodeComponent = ComponentType<CanvasNodeProps>;

export type NodeInspectorFieldsProps = {
  formId: string;
  node: GraphNode;
  svc: ServiceDefinition;
  /** Present when the graph has been saved to the server (Lambda zip upload). */
  serverGraphId?: string | null;
  register: UseFormReturn<FormValues>["register"];
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  getValues: UseFormReturn<FormValues>["getValues"];
  setValue: UseFormReturn<FormValues>["setValue"];
};

export type UiServiceModule = {
  canvasNode: CanvasNodeComponent;
  canvasTitle: (node: GraphNode) => string;
  InspectorFields: ComponentType<NodeInspectorFieldsProps>;
  inspectorFormDefaults?: (
    node: GraphNode,
    base: FormValues,
    svc: ServiceDefinition,
  ) => FormValues;
};
