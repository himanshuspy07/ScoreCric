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
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `A professional and clean sports logo for a cricket team named "${input.teamName}". 
      The primary color should be "${input.colorName}". 
      The logo should be minimalist, modern, and flat design, suitable for a mobile app icon. 
      White background. No text except possibly initials. Bold shapes.`,
    });

    if (!media) {
      throw new Error('Failed to generate logo');
    }

    return media.url;
  }
);
