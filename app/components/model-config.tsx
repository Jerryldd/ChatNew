import { ServiceProvider } from "@/app/constant";
import {
  ModalConfigValidator,
  ModelConfig,
  useFlowStore,
  getExpectInputType,
  parseInput,
} from "../store";

import Locale from "../locales";
import { InputRange } from "./input-range";
import { ListItem, Select } from "./ui-lib";
import { useAllModels } from "../utils/hooks";

export function ModelConfigList(props: {
  modelConfig: ModelConfig;
  updateConfig: (updater: (config: ModelConfig) => void) => void;
}) {
  const flowModels = useFlowStore((state) => state.models());
  const value = `${props.modelConfig.model}@${props.modelConfig?.providerName}`;
  const components = props.modelConfig.components;

  return (
    <>
      <ListItem title={Locale.Settings.Model}>
        <Select
          value={value}
          onChange={(e) => {
            const [model, providerName] = e.currentTarget.value.split("@");
            props.updateConfig((config) => {
              config.model = ModalConfigValidator.model(model);
              config.providerName = providerName as ServiceProvider;
            });
          }}
        >
          {flowModels
            .filter((v) => v.available)
            .map((v, i) => (
              <option value={`${v.name}@${v.provider?.providerName}`} key={i}>
                {v.displayName}({v.provider?.providerName})
              </option>
            ))}
        </Select>
      </ListItem>
      {components &&
        components.map((component, componentIndex) => {
          return (
            component.tweaks &&
            component.tweaks.map((tweak, tweakIndex) => {
              return (
                <ListItem
                  title={tweak.displayName}
                  subTitle={tweak.description}
                  key={tweakIndex}
                >
                  <input
                    type={getExpectInputType(tweak.value_type)}
                    value={tweak.value?.toString() ?? ""}
                    onChange={(e) => {
                      const i = componentIndex;
                      const j = tweakIndex;
                      props.updateConfig(
                        (config) =>
                          (config.components[i].tweaks[j].value = parseInput(
                            tweak.value_type,
                            e.currentTarget.value,
                          )),
                      );
                    }}
                  ></input>
                </ListItem>
              );
            })
          );
        })}
      {props.modelConfig?.providerName == ServiceProvider.Google ? null : (
        <>
          <ListItem
            title={Locale.Settings.InjectSystemPrompts.Title}
            subTitle={Locale.Settings.InjectSystemPrompts.SubTitle}
          >
            <input
              type="checkbox"
              checked={props.modelConfig.enableInjectSystemPrompts}
              onChange={(e) =>
                props.updateConfig(
                  (config) =>
                    (config.enableInjectSystemPrompts =
                      e.currentTarget.checked),
                )
              }
            ></input>
          </ListItem>

          <ListItem
            title={Locale.Settings.InputTemplate.Title}
            subTitle={Locale.Settings.InputTemplate.SubTitle}
          >
            <input
              type="text"
              value={props.modelConfig.template}
              onChange={(e) =>
                props.updateConfig(
                  (config) => (config.template = e.currentTarget.value),
                )
              }
            ></input>
          </ListItem>
        </>
      )}
      <ListItem
        title={Locale.Settings.HistoryCount.Title}
        subTitle={Locale.Settings.HistoryCount.SubTitle}
      >
        <InputRange
          title={props.modelConfig.historyMessageCount.toString()}
          value={props.modelConfig.historyMessageCount}
          min="0"
          max="64"
          step="1"
          onChange={(e) =>
            props.updateConfig(
              (config) => (config.historyMessageCount = e.target.valueAsNumber),
            )
          }
        ></InputRange>
      </ListItem>

      <ListItem
        title={Locale.Settings.CompressThreshold.Title}
        subTitle={Locale.Settings.CompressThreshold.SubTitle}
      >
        <input
          type="number"
          min={500}
          max={4000}
          value={props.modelConfig.compressMessageLengthThreshold}
          onChange={(e) =>
            props.updateConfig(
              (config) =>
                (config.compressMessageLengthThreshold =
                  e.currentTarget.valueAsNumber),
            )
          }
        ></input>
      </ListItem>
      <ListItem title={Locale.Memory.Title} subTitle={Locale.Memory.Send}>
        <input
          type="checkbox"
          checked={props.modelConfig.sendMemory}
          onChange={(e) =>
            props.updateConfig(
              (config) => (config.sendMemory = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>
    </>
  );
}
