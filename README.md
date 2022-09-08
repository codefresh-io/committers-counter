# Codefresh Committers Counter

## Purpose

For some on-prem customers we are not able to count committers in the system
because they are using cron triggers to run their pipelines. That's why this 
script was written.

## Usage

### Images

`gcr.io/codefresh-inc/codefresh/committers-counter:master`

`gcr.io/codefresh-enterprise/codefresh/committers-counter:master`

`quay.io/codefresh/committers-counter:master`


### Command

```shell
docker run \
  -e GIT_TOKEN=... \
  -e GIT_REPOSITORIES=codefresh/cli,codefresh/cf-api \
  -e DATE_START=2022-05-08 \
  -e DATE_END=2022-09-08 \
  -v /tmp:/tmp \
  quay.io/codefresh/committers-counter:master 
```

### Params (envs)

`GIT_TOKEN` and `GIT_REPOSITORIES` are required parameters.

`GIT_TOKEN` must have `repos:read` scope

`GIT_REPOSITORIES` should be the list of repo names separated by comma

`DATE_START` and `DATE_END` are optional parameters -- by default script
will try to take committers in dates between start and the end of current
month (f.e. `01.09` and `31.09` for September)

##### Note:

Mount some folder to `/tmp` inside container to be able to find `result.json`
file inside your filesystem.
