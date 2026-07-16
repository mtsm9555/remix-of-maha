import { z } from "zod";
import { MahaTool } from "../MahaTool";
import type { ToolContext } from "../ToolSDKTypes";

const SlackMessageSchema = z.object({
  channel: z.string().describe("Slack channel ID or name (e.g. '#general')"),
  message: z.string().min(1).max(3000).describe("Text message to send"),
  isUrgent: z.boolean().optional().default(false),
});

type SlackMessageArgs = z.input<typeof SlackMessageSchema>;
type SlackMessageResult = { messageId: string; threadTs: string };

export class SendSlackMessageTool extends MahaTool<SlackMessageArgs, SlackMessageResult> {
  constructor() {
    super({
      name: "send_slack_message",
      description: "Sends a text message to a specified Slack channel.",
      parameters: SlackMessageSchema,
    });
  }

  protected async run(args: SlackMessageArgs, context: ToolContext): Promise<SlackMessageResult> {
    console.log(`[SendSlackMessage] Sending to ${args.channel} on behalf of ${context.agentId}...`);
    if (args.channel === "#invalid-channel") {
      throw new Error("Slack API returned channel_not_found");
    }
    return { messageId: `msg_${Date.now()}`, threadTs: `ts_${Date.now()}` };
  }
}