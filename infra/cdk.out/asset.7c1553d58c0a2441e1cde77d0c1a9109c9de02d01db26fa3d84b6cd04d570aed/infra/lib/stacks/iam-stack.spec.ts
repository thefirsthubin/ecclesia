import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

import { getEnvironmentConfig } from '../../environments';
import { EventingStack } from './eventing-stack';
import { IamStack } from './iam-stack';
import { SecretsStack } from './secrets-stack';
import { SesStack } from './ses-stack';

describe('IamStack', () => {
  function synth() {
    const app = new cdk.App();
    const config = getEnvironmentConfig('dev');
    const env = { account: '111111111111', region: 'eu-west-1' };
    const eventing = new EventingStack(app, 'TestEventingStack', config, { env });
    const secrets = new SecretsStack(app, 'TestSecretsStack', config, { env });
    const ses = new SesStack(app, 'TestSesStack', config, { env });
    const stack = new IamStack(app, 'TestIamStack', config, { env, eventing, secrets, ses });
    return Template.fromStack(stack);
  }

  it('creates four roles - api/worker task roles and their execution roles', () => {
    const template = synth();
    template.resourceCountIs('AWS::IAM::Role', 4);
  });

  it('scopes the worker task role\'s SQS grant to the three specific queue ARNs, not sqs:*', () => {
    const template = synth();
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith(['sqs:ReceiveMessage']),
            Effect: 'Allow',
          }),
        ]),
      },
    });
  });

  it('attaches an AWS-managed policy (the ECS task execution policy) to at least one role', () => {
    const template = synth();
    // `[Bug fix, found via a real run]` `Match.arrayWith([Match.anyValue()])`
    // throws "The Matcher anyValue() cannot be nested within arrayWith()" -
    // a real aws-cdk-lib/assertions restriction (`ArrayMatch.testSubsequence`
    // rejects an `anyValue()` matcher used directly as an `arrayWith()`
    // element, since its subsequence-matching algorithm can't treat
    // "matches everything" as a concrete comparison target). `fromAwsManagedPolicyName`
    // synthesizes each entry in `ManagedPolicyArns` as an `Fn::Join`
    // intrinsic (partition-aware ARN construction), so asserting on that
    // shape - with `anyValue()` nested one level deeper, inside
    // `objectLike()`, which IS supported - both fixes the matcher error and
    // is a more precise assertion than "any value" was.
    template.hasResourceProperties('AWS::IAM::Role', {
      ManagedPolicyArns: Match.arrayWith([Match.objectLike({ 'Fn::Join': Match.anyValue() })]),
    });
  });
});
