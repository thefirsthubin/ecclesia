import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import type { Construct } from 'constructs';

import { EcclesiaStack } from '../common/ecclesia-stack';
import { writeParameter } from '../common/parameters';
import type { EnvironmentConfig } from '../common/types';
import type { NetworkStack } from './network-stack';

export interface AlbStackProps extends cdk.StackProps {
  network: NetworkStack;
}

/**
 * Cloud Runtime Infrastructure milestone (Milestone 10) §6 - the
 * Application Load Balancer, in `NetworkStack`'s public subnets.
 *
 * `[Design Decision]` **HTTPS-ready, not HTTPS-required**: the milestone
 * brief's own §6 heading is "HTTPS-ready Application Load Balancer," and
 * separately says "No WAF required yet" - read together with no domain
 * being registered yet (this milestone's preceding roadmap discussion),
 * this stack always creates the HTTP (port 80) listener, and creates the
 * HTTPS (port 443) listener + redirect **only when**
 * `config.alb.certificateArn` is set. Nothing is left half-configured
 * either way: with no certificate, the ALB serves HTTP only (matches
 * today's actual state - no TLS material exists to serve); once a real
 * domain + ACM certificate exist, setting `certificateArn` and redeploying
 * is the only change needed - no stack code changes, per the milestone's
 * own "environment-aware configuration... no duplicated infrastructure"
 * requirement applied to this exact situation.
 *
 * `ApiServiceStack` owns the actual target group + listener rule (this
 * stack exposes the listener, not the target) - keeping "which service
 * gets which path" a Compute-layer concern, not a Network-layer one, so a
 * future Web Admin ECS service (the milestone brief's own "Support...
 * Future Web Admin") can add its own listener rule without this stack
 * changing.
 */
export class AlbStack extends EcclesiaStack {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly httpListener: elbv2.ApplicationListener;
  public readonly httpsListener?: elbv2.ApplicationListener;

  constructor(scope: Construct, id: string, config: EnvironmentConfig, props: AlbStackProps) {
    super(scope, id, config, props);

    const { network } = props.network;

    this.alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      loadBalancerName: this.resourceName('alb'),
      vpc: network.vpc,
      internetFacing: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: network.albSecurityGroup,
    });

    const noTargetConfigured = elbv2.ListenerAction.fixedResponse(503, {
      contentType: 'text/plain',
      messageBody: 'Ecclesia: no service is registered on this listener yet.',
    });

    if (config.alb.certificateArn) {
      // HTTP -> HTTPS redirect once a real certificate exists - the whole
      // point of "HTTPS-ready" is that this branch requires zero stack
      // changes, only the config field.
      this.httpListener = this.alb.addListener('HttpListener', {
        port: 80,
        defaultAction: elbv2.ListenerAction.redirect({ protocol: 'HTTPS', port: '443', permanent: true }),
      });
      this.httpsListener = this.alb.addListener('HttpsListener', {
        port: 443,
        certificates: [acm.Certificate.fromCertificateArn(this, 'Certificate', config.alb.certificateArn)],
        defaultAction: noTargetConfigured,
      });
    } else {
      this.httpListener = this.alb.addListener('HttpListener', {
        port: 80,
        defaultAction: noTargetConfigured,
      });
    }

    writeParameter(this, 'AlbDnsNameParam', config.envName, 'alb', 'dns-name', this.alb.loadBalancerDnsName);

    new cdk.CfnOutput(this, 'AlbDnsNameOutput', { value: this.alb.loadBalancerDnsName, description: 'Application Load Balancer DNS name' });
  }
}
