export type ShareKind = 'derivative' | 'integral' | 'limit' | 'ode';

export type ShareInput = {
  type?: string;
  equation: string;
  result?: string;
  limitTo?: string;
};

function clip(value: string, max: number): string {
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}

export function buildSharePath(input: ShareInput): string {
  const params = new URLSearchParams();
  const type = input.type === 'integral' || input.type === 'limit' || input.type === 'ode'
    ? input.type
    : 'derivative';
  params.set('type', type);
  params.set('eq', clip(input.equation || '', 180));
  if (input.result) params.set('result', clip(input.result, 180));
  if (type === 'limit' && input.limitTo) params.set('to', clip(input.limitTo, 40));
  return `/result?${params.toString()}`;
}

export function calculatorPathForShare(input: ShareInput): string {
  const type = input.type === 'integral' || input.type === 'limit' || input.type === 'ode'
    ? input.type
    : 'derivative';
  const params = new URLSearchParams();
  params.set('equation', clip(input.equation || '', 180));
  if (type === 'limit' && input.limitTo) params.set('to', clip(input.limitTo, 40));
  const base = type === 'integral' ? '/integral' : type === 'limit' ? '/limit' : type === 'ode' ? '/ode' : '/';
  return `${base}?${params.toString()}`;
}
