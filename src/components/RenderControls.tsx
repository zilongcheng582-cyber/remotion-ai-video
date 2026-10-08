import { z } from "zod";
import { MOTION_DEMO_NAME, MotionDemoProps } from "../../types/constants";
import { useRendering } from "../helpers/use-rendering";
import { AlignEnd } from "./AlignEnd";
import { Button } from "./Button";
import { InputContainer } from "./Container";
import { DownloadButton } from "./DownloadButton";
import { ErrorComp } from "./Error";
import { Input } from "./Input";
import { ProgressBar } from "./ProgressBar";
import { Spacing } from "./Spacing";

export const RenderControls: React.FC<{
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  subtitle: string;
  setSubtitle: React.Dispatch<React.SetStateAction<string>>;
  inputProps: z.infer<typeof MotionDemoProps>;
}> = ({ title, setTitle, subtitle, setSubtitle, inputProps }) => {
  const { renderMedia, state, undo } = useRendering(
    MOTION_DEMO_NAME,
    inputProps,
  );

  return (
    <InputContainer>
      {state.status === "init" ||
      state.status === "invoking" ||
      state.status === "error" ? (
        <>
          <div className="flex flex-col gap-4">
            <Input
              id="video-title"
              label="Title"
              disabled={state.status === "invoking"}
              setText={setTitle}
              text={title}
            ></Input>
            <Input
              id="video-subtitle"
              label="Subtitle"
              disabled={state.status === "invoking"}
              setText={setSubtitle}
              text={subtitle}
            ></Input>
          </div>
          <AlignEnd className="mt-4">
            <Button
              disabled={state.status === "invoking"}
              loading={state.status === "invoking"}
              onClick={renderMedia}
            >
              Render Video
            </Button>
          </AlignEnd>
          {state.status === "invoking" ? (
            <>
              <Spacing></Spacing>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.5,
                  minHeight: "2.5em",
                  marginBottom: 8,
                }}
              >
                <div style={{ color: "#666" }}>
                  {state.phase}
                  {state.progress < 1
                    ? ` ${Math.max(Math.round(state.progress * 100), 1)}%`
                    : null}
                </div>
                <div
                  style={{
                    color: "#999",
                    fontSize: 12,
                    visibility: state.subtitle ? "visible" : "hidden",
                  }}
                >
                  {state.subtitle ?? "\u00A0"}
                </div>
              </div>
              <ProgressBar progress={state.progress} />
            </>
          ) : null}
          {state.status === "error" ? (
            <ErrorComp message={state.error.message}></ErrorComp>
          ) : null}
        </>
      ) : null}
      {state.status === "done" ? (
        <>
          <ProgressBar progress={1} />
          <Spacing></Spacing>
          <AlignEnd>
            <DownloadButton undo={undo} state={state}></DownloadButton>
          </AlignEnd>
        </>
      ) : null}
    </InputContainer>
  );
};
