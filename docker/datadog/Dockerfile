FROM datadog/agent:latest
ADD datadog.yaml /etc/datadog-agent/datadog.yaml
ADD conf.d/redisdb.yaml /etc/datadog-agent/conf.d/redisdb.d/conf.yaml
ADD conf.d/nodejs.yaml /etc/datadog-agent/conf.d/nodejs.d/conf.yaml
ADD conf.d/docker_daemon.yaml /etc/datadog-agent/conf.d/docker.d/docker_daemon.yaml
