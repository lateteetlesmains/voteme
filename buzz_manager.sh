#! /bin/bash
function check_root() {
    if [[ $EUID -ne 0 ]]; then
        return 0
    else
        return 1
    fi
}

#installation globale
dockerBin=/usr/bin/docker
function pi_insudo() {
    local out=$(getent passwd $SUDO_USER | cut -d : -f 1 | grep pi)

    if [[ $out == "pi" ]]; then
        home_path="/home/pi/"
    else
        echo "Pas d'utilisateur pi trouvé pour sudo. Arrêt du script"
        exit 1
    fi
}
function check() {

    if [[ ! -f /usr/bin/docker-compose ]]; then
        if [[ ! -f /usr/local/bin/docker-compose ]]; then

            /bin/echo "docker-compose n'est pas installé, installation"
            install_prerequisites
            install_python_requirements
        else
            echo "docker-compose est déjà installé"
        fi

    else
        echo "docker-compose est déjà installé"

    fi

    if [[ ! -f $dockerBin ]]; then
        /bin/echo "Docker n'est pas installé, installation"
        install_docker
    else

        echo "Docker est déjà installé"

    fi

}

function update_system() {
    echo "Mise à jour du système"
    apt update
}
function install_prerequisites() {
    echo "Installation des prérequis pour docker-compose"
    apt install -y curl libffi-dev libssl-dev python3-dev python3 python3-pip git --no-install-recommends

}

function install_python_requirements() {
    echo "Installation de docker-compose"
    python3 -m pip install --upgrade pip
    python3 -m pip install docker-compose
}

function install_docker() {
    echo "Récupération du script d'installation docker"
    curl -fsSL https://get.docker.com -o "${home_path}get-docker.sh"
    sh "${home_path}get-docker.sh"
}
function remove_docker() {
    echo "Désinstallation de docker"
    apt remove docker-ce docker-ce-cli containerd.io
    apt purge docker-ce docker-ce-cli containerd.io
    apt clean
    apt autoremove
}

function post_install() {
    echo "Ajout de pi dans le groupe docker (évite de taper les commandes docker préfixées de sudo"
    usermod -aG docker pi
    /bin/echo "Le redemarrage est requis pour la prise en compte des droit. Redémarrer ? [o/n]"
    read confirm
    if [[ $confirm == "o" ]]; then
        reboot
    fi

}

#lancement des conteneurs

function get_source_code() {
    if [[ ! -d /home/pi/Documents/voteme ]]; then
        echo "Récupération du code source serveur sur github"
        git clone http://pi4:10080/damien/voteme
    else
        echo "Code source présent"
    fi

}

function build_remote() {
    docker-compose -f voteme/docker-compose-remote.yml up -d

}

function build_local() {
    docker-compose -f voteme/docker-compose.yml up -d
}

case "$1" in
start)
    check_root
    if [[ $? == 0 ]]; then
        echo "Les privilèges root sont nécesaires pour cette option"
        exit 1

    else
        pi_insudo
        update_system
        check
        post_install
        echo "fin"

    fi

    ;;

remote)
    check_root
    if [[ $? == 1 ]]; then
        echo "Cette option doit être lancée sans sudo"
        exit 1
    else
        get_source_code
        build_remote
    fi
    ;;

local)
    check_root
    if [[ $? == 1 ]]; then
        echo "Cette option doit être lancée sans sudo"
        exit 1
    else
        get_source_code
        build_local
    fi
    ;;

clear)
    remove_docker
    ;;
*)
    echo "utilisation : "
    ;;
esac
