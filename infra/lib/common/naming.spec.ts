import { parameterPath, resourceName, stackId } from './naming';

describe('naming', () => {
  it('resourceName() applies the ecclesia-{env}-{logicalName} convention', () => {
    expect(resourceName('dev', 'user-pool')).toBe('ecclesia-dev-user-pool');
    expect(resourceName('production', 'engagement-signals')).toBe('ecclesia-production-engagement-signals');
  });

  it('stackId() PascalCases the environment name', () => {
    expect(stackId('dev', 'Cognito')).toBe('Ecclesia-Dev-Cognito');
    expect(stackId('staging', 'Eventing')).toBe('Ecclesia-Staging-Eventing');
    expect(stackId('production', 'Iam')).toBe('Ecclesia-Production-Iam');
  });

  it('parameterPath() follows the /ecclesia/{env}/{category}/{key} SSM convention', () => {
    expect(parameterPath('dev', 'eventing', 'bus-name')).toBe('/ecclesia/dev/eventing/bus-name');
  });
});
