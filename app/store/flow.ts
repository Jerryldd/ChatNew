import { create } from "zustand";
import { LLMModel } from "@/app/client/api";
import { createEmptyMask, Mask } from "@/app/store/mask";
import { ServiceProvider } from "@/app/constant";
import { message } from "antd";

type StringType = {
  str: string;
  int: number;
  float: number;
  json: Record<string, any>;
};

type GetType<T extends keyof StringType> = StringType[T];

type TweakType = GetType<keyof StringType>;

export function parseInput(type: string, value: string): TweakType | undefined {
  if (!value) {
    return undefined;
  }
  switch (type) {
    case "str":
      return value;
    case "int":
      return parseInt(value);
    case "float":
      return parseFloat(value);
    case "json":
      return JSON.parse(value);
    default:
      throw new Error("Invalid type");
  }
}

export function getExpectInputType(type: string): string {
  switch (type) {
    case "str":
      return "string";
    case "int":
      return "number";
    case "float":
      return "number";
    case "json":
      return "string";
    default:
      throw new Error("Invalid type");
  }
}

export interface Tweak {
  name: string;
  displayName: string;
  description?: string;
  value?: TweakType;
  value_type: string;
}

export interface Component {
  componentId: string;
  tweaks: Tweak[];
}

export interface Flow {
  flowName: string;
  flowId: string;
  components: Component[];
}

export interface FlowStore {
  userId: string;
  flows: Flow[];
  refreshFlows: () => void;
  moveFlow: (fromIndex: number, toIndex: number) => void;
  models: () => LLMModel[];
  modelTweaks: (flowId: string) => Tweak[];
  createFlowMask: (flowId: string) => Mask;
  getFlow: (flowId: string) => Flow;
}

const initialFlowStore: FlowStore = {
  userId: "",
  flows: [] as Flow[],
  refreshFlows: () => {},
  moveFlow: () => {},
  models: () => [],
  modelTweaks: (flowId) => [],
  createFlowMask: (flowId) => {
    throw new Error("Not implemented");
  },
  getFlow: (flowId) => {
    throw new Error("Not implemented");
  },
};

function buildFlow(flow: any): Flow {
  const flowId = flow.flowId as string;
  const flowName = flow.flowName as string;
  const nodes = flow.data.nodes;
  const components: Component[] = [];
  for (const node of nodes) {
    const tweaks = node.data.node.tweaks;
    const nodeId = node.id;
    const nodeTweaks: Tweak[] = [];
    for (const tweak of tweaks) {
      const newTweak: Tweak = {
        name: tweak.name,
        displayName: tweak.display_name,
        description: tweak?.description,
        value: tweak?.default,
        value_type: tweak.value_type,
      };
      nodeTweaks.push(newTweak);
    }
    components.push({ componentId: nodeId, tweaks: nodeTweaks });
  }
  return { flowId: flowId, flowName: flowName, components: components };
}

export interface RunFlowRequestBody {
  input_value: string;
  input_type: string;
  output_type: string;
  stream: boolean;
  tweaks: {
    [key: string]: {
      [key: string]: TweakType;
    };
  };
}

export function getRunFlowRequestBody(
  input: string,
  stream: boolean,
  components: Component[],
): RunFlowRequestBody {
  const tweaks = {} as RunFlowRequestBody;
  tweaks["input_value"] = input;
  tweaks["input_type"] = "chat";
  tweaks["output_type"] = "chat";
  tweaks["tweaks"] = {};
  for (const component of components) {
    const componentTweaks = {} as { [key: string]: TweakType };
    for (const tweak of component.tweaks) {
      if (tweak.value) {
        componentTweaks[tweak.name] = tweak.value;
      }
    }
    tweaks["tweaks"][component.componentId] = componentTweaks;
  }
  tweaks["stream"] = stream;
  return tweaks;
}

export const useFlowStore = create<FlowStore>((set, get) => ({
  ...initialFlowStore,

  moveFlow: (fromIndex: number, toIndex: number) => {
    const flows = get().flows;
    const newFlows = [...flows];
    const [removed] = newFlows.splice(fromIndex, 1);
    newFlows.splice(toIndex, 0, removed);
    set({ flows: newFlows });
  },

  getFlow: (flowId: string) => {
    const flow = get().flows.find((flow) => flow.flowId === flowId);
    if (!flow) {
      throw new Error("Invalid flowId");
    }
    return flow;
  },

  refreshFlows: () => {
    fetch(`/api/langflow/flows`, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((res) => {
        const data = res.data;
        const result: Flow[] = [];
        for (const flow of data) {
          result.push(buildFlow(flow));
        }
        set({ flows: result });
      });
  },

  models: () => {
    const flows = get().flows;
    return flows.map((flow) => ({
      name: flow.flowId,
      displayName: flow.flowName,
      available: true,
      provider: {
        id: "langflow",
        providerName: "Langflow",
        providerType: "langflow",
      },
    })) as LLMModel[];
  },

  modelTweaks: (flowId: string) => {
    return get()
      .getFlow(flowId)
      .components.flatMap((component) => component.tweaks);
  },

  createFlowMask: (flowId: string) => {
    const mask = createEmptyMask();
    mask.modelConfig.components = get().getFlow(flowId).components;
    mask.modelConfig.model = flowId;
    mask.modelConfig.providerName = ServiceProvider.Langflow;
    mask.modelConfig.displayName = "Langflow";
    mask.syncGlobalConfig = false;
    return mask;
  },
}));
