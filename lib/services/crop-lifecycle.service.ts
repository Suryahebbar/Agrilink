import { CROP_TEMPLATES, CropTemplate, StageTemplate } from '../data/cropTemplates';

export interface GeneratedPlanTask {
  taskId: string;
  category: 'irrigation' | 'fertilizer' | 'pest_scouting' | 'labour' | 'harvest';
  title: string;
  description: string;
  dueDayOffset: number;
  dueDate: Date;
  stageName: string;
  dosage?: string;
  completed: boolean;
}

export interface PlanGenerationResult {
  cropKey: string;
  cropName: string;
  sowingDate: Date;
  acreage: number;
  expectedHarvestDate: Date;
  totalLabourHoursEstimated: number;
  expectedYieldEstimated: string;
  tasks: GeneratedPlanTask[];
}

export class CropLifecycleService {
  /**
   * Generates a date-stamped dynamic crop calendar and task checklist from an agronomic template.
   */
  public static generatePlan(
    cropKey: string,
    sowingDateInput: string | Date,
    acreage: number
  ): PlanGenerationResult {
    const template: CropTemplate = CROP_TEMPLATES[cropKey.toLowerCase()] || CROP_TEMPLATES.paddy;
    const sowingDate = new Date(sowingDateInput);
    
    // Calculate expected harvest date
    const expectedHarvestDate = new Date(sowingDate);
    expectedHarvestDate.setDate(sowingDate.getDate() + template.totalGrowthDurationDays);

    const tasks: GeneratedPlanTask[] = [];

    // 1. Sowing / Land Prep Task
    tasks.push({
      taskId: `sow_${Date.now()}_0`,
      category: 'labour',
      title: `Sowing & Bed Preparation (${template.cropName})`,
      description: `Prepare plot beds, ensure optimal soil tilth and seed moisture. Acreage: ${acreage} Acres.`,
      dueDayOffset: 0,
      dueDate: new Date(sowingDate),
      stageName: template.stages[0]?.name || 'Nursery & Land Prep',
      completed: false
    });

    // 2. Iterate Stages for Irrigation, Fertilizers, & Pest Surveillance
    template.stages.forEach((stage, stageIdx) => {
      // (a) Scheduled Fertilizers
      stage.fertilizers.forEach((fert, fertIdx) => {
        const fertDate = new Date(sowingDate);
        fertDate.setDate(sowingDate.getDate() + fert.recommendedDayOffset);

        // Scale dosage with acreage
        const baseKg = parseFloat(fert.dosagePerAcre) || 0;
        const totalScaled = baseKg > 0 ? `${(baseKg * acreage).toFixed(1)} kg total (${fert.dosagePerAcre}/acre)` : fert.dosagePerAcre;

        tasks.push({
          taskId: `fert_${stage.stageId}_${fertIdx}`,
          category: 'fertilizer',
          title: `Apply ${fert.name} (${fert.type})`,
          description: `Stage: ${stage.name}. Apply ${totalScaled} evenly across ${acreage} acres.`,
          dueDayOffset: fert.recommendedDayOffset,
          dueDate: fertDate,
          stageName: stage.name,
          dosage: totalScaled,
          completed: false
        });
      });

      // (b) Periodic Irrigation Intervals
      if (stage.irrigationFrequencyDays > 0) {
        let currOffset = stage.startDayOffset + 1;
        let count = 1;
        while (currOffset <= stage.endDayOffset) {
          const irrigDate = new Date(sowingDate);
          irrigDate.setDate(sowingDate.getDate() + currOffset);

          tasks.push({
            taskId: `irrig_${stage.stageId}_${count}`,
            category: 'irrigation',
            title: `Irrigation Cycle #${count} (${stage.name.split('(')[0].trim()})`,
            description: stage.irrigationNote,
            dueDayOffset: currOffset,
            dueDate: irrigDate,
            stageName: stage.name,
            completed: false
          });

          currOffset += stage.irrigationFrequencyDays;
          count++;
        }
      }

      // (c) Pest Scouting Windows
      if (stage.pestRisks && stage.pestRisks.length > 0) {
        const scoutOffset = Math.floor((stage.startDayOffset + stage.endDayOffset) / 2);
        const scoutDate = new Date(sowingDate);
        scoutDate.setDate(sowingDate.getDate() + scoutOffset);

        const pestNames = stage.pestRisks.map(p => p.pestName).join(', ');
        const advisories = stage.pestRisks.map(p => `• ${p.pestName}: ${p.symptoms} -> ${p.preventionAdvisory}`).join('\n');

        tasks.push({
          taskId: `scout_${stage.stageId}`,
          category: 'pest_scouting',
          title: `Pest & Disease Scouting (${stage.name.split('(')[0].trim()})`,
          description: `Watch for: ${pestNames}.\nAdvisory Guidance:\n${advisories}`,
          dueDayOffset: scoutOffset,
          dueDate: scoutDate,
          stageName: stage.name,
          completed: false
        });
      }
    });

    // 3. Final Harvest Milestone Task
    tasks.push({
      taskId: `harvest_${Date.now()}`,
      category: 'harvest',
      title: `Final Harvest & Sorting (${template.cropName})`,
      description: `Expected yield: ${template.expectedYieldPerAcre}. Mobilize harvesting labour or machinery.`,
      dueDayOffset: template.totalGrowthDurationDays,
      dueDate: expectedHarvestDate,
      stageName: template.stages[template.stages.length - 1]?.name || 'Harvesting',
      completed: false
    });

    // Sort tasks chronologically
    tasks.sort((a, b) => a.dueDayOffset - b.dueDayOffset);

    return {
      cropKey: template.cropId,
      cropName: template.cropName,
      sowingDate,
      acreage,
      expectedHarvestDate,
      totalLabourHoursEstimated: Math.round(template.standardLabourHoursPerAcre * acreage),
      expectedYieldEstimated: template.expectedYieldPerAcre,
      tasks
    };
  }
}
