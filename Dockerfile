FROM python:3.7-buster

#Pour windows
#RUN apt-get update && apt-get install nginx -y --no-install-recommends
#pour linux (RaspberryPi)
RUN apt-get update && apt-get install nginx build-essential libssl-dev libffi-dev python3-dev cargo -y --no-install-recommends


COPY nginx.default /etc/nginx/sites-available/default

RUN ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log

RUN mkdir -p /opt/app
COPY requirements.txt /opt/app/
COPY server-start.sh /opt/app/server-start.sh
RUN chmod +x /opt/app/server-start.sh
WORKDIR /opt/app/
RUN python -m pip install --upgrade pip
RUN python -m pip install -r requirements.txt
RUN python -m pip install uvicorn['standard']

COPY src /opt/app/voteme/
WORKDIR /opt/app/voteme
EXPOSE 80
# COPY . ${APP_WORKDIR}

# This is only needed if daphne is going to be running behind a proxy like nginx.
CMD ["/opt/app/server-start.sh"]
