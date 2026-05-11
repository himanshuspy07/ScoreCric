'use server';
/**
 * @fileOverview A team branding AI agent.
 *
 * - generateTeamLogo - A function that generates a team logo based on name and color.
 * - TeamLogoInput - The input type for the generateTeamLogo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TeamLogoInputSchema = z.object({
  teamName: z.string().describe('The name of the cricket team.'),
  colorName: z.string().describe('The primary color for the logo.'),
});
export type TeamLogoInput = z.infer<typeof TeamLogoInputSchema>;

export async function generateTeamLogo(input: TeamLogoInput) {
  return generateTeamLogoFlow(input);
}

const generateTeamLogoFlow = ai.defineFlow(
  {
    name: 'generateTeamLogoFlow',
    inputSchema: TeamLogoInputSchema,
    outputSchema: z.string().describe('Data URI of the generated logo.'),
  },
  async (input) => {
    try {
      const { media } = await ai.generate({
        model: 'googleai/imagen-3.0-fast-generate-001',
        prompt: `A professional and clean sports logo for a cricket team named "${input.teamName}". 
        The primary color should be "${input.colorName}". 
        The logo should be minimalist, modern, and flat design, suitable for a mobile app icon. 
        White background. No text except possibly initials. Bold shapes.`,
      });

      if (!media || !media.url) {
        throw new Error('Failed to generate logo');
      }

      return media.url;
    } catch (error: any) {
      // Catch specific billing/plan errors to pass back to the UI
      if (error.message?.includes('paid plans') || error.message?.includes('billing')) {
        throw new Error('AI_BILLING_REQUIRED');
      }
      throw error;
    }
  }
);
