FROM python:3.7-buster as build

#Pour windows
#RUN apt-get update && apt-get install nginx -y --no-install-recommends
#pour linux (RaspberryPi)
COPY server-start.sh /opt/app/
COPY requirements.txt /opt/app/

RUN apt-get update \
	&& apt-get install nginx build-essential libssl-dev libffi-dev python3-dev cargo -y --no-install-recommends \
	&& ln -sf /dev/stdout /var/log/nginx/access.log \
	&& ln -sf /dev/stderr /var/log/nginx/error.log \
	&& mkdir -p /opt/app \
	&& chmod +x /opt/app/server-start.sh \
	&& python -m pip install --upgrade pip \
	&& python -m pip install -r /opt/app/requirements.txt \
	&& python -m pip install uvicorn['standard']

COPY nginx.default /etc/nginx/sites-available/default
#WORKDIR /opt/app/

COPY src /opt/app/voteme/

COPY --from=build /app/voteme /

EXPOSE 8080
# COPY . ${APP_WORKDIR}

# This is only needed if daphne is going to be running behind a proxy like nginx.
CMD ["/opt/app/server-start.sh"]
