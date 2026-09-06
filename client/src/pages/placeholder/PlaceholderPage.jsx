import React from 'react';
import * as Icons from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const PlaceholderPage = ({
  title = 'HRMS Module',
  description = 'Manage and configure your organization workforce data.',
  part = '04',
  iconName = 'Layers',
  action = null,
}) => {
  const IconComponent = Icons[iconName] || Icons.Layers;

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        action={action}
      />

      <Card className="text-center py-12">
        <CardBody className="flex flex-col items-center justify-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center border border-orange-200 shadow-xs">
            <IconComponent className="w-8 h-8" />
          </div>

          <div>
            <div className="inline-block mb-2">
              <Badge variant="primary">Coming in Part {part}</Badge>
            </div>
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              This module is scheduled for implementation in <strong>Part {part}</strong>. The foundational application shell, permission guards, routing structure, and design system components are ready to receive this feature.
            </p>
          </div>

          <div className="pt-4 flex items-center gap-2 text-xs text-slate-400">
            <Icons.CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Design system & layout foundation established</span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
