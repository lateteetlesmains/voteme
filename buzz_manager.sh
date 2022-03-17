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
function check_env(){
    if [[ $PWD != "/home/pi/Documents" ]]; then
        
        if [[ -d /home/pi/Documents ]]; then
            
            cd "/home/pi/Documents"
            
        else
            echo "Le script doit être exécuté depuis le repertoire Documents"
            
        fi
        
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

function remove_prerequisites(){
    apt remove -y libffi-dev libssl-dev
}

function install_python_requirements() {
    echo "Installation de docker-compose"
    python3 -m pip install --upgrade pip
    python3 -m pip install docker-compose
}
function remove_python_requirements(){
    echo "Désinstallation des prérequis python"
    python3 -m pip uninstall docker-compose
    
}
function install_docker() {
    echo "Récupération du script d'installation docker"
    curl -fsSL https://get.docker.com -o "${home_path}get-docker.sh"
    sh "${home_path}get-docker.sh"
}
function remove_docker() {
    echo "Désinstallation de docker"
    apt remove docker-ce docker-ce-cli containerd.io -y
    apt purge docker-ce docker-ce-cli containerd.io -y
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
        git clone https://github.com/adl1422/voteme
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

# Wifi AP

function install_wifi_prerequisites(){
    echo "Installation des outils necessaires pour l'access point wifi"
    apt install hostapd dnsmasq bridge-utils -y --no-install-recommends
    echo "Arrêt des services le temps de la configuration"
    systemctl stop hostapd
    systemctl stop dnsmasq
}

function enable_wifi_services(){
    systemctl enable hostapd
    systemctl enable dnsmasq
}

function set_fixed_ip(){
    echo "Définition d'une ip fixe sur 192.168.4.1"
    
    if [[ ! -f /etc/dhcpcd.conf.orig ]]; then
        echo "Sauvegarde du fichier de conf initial"
        cp /etc/dhcpcd.conf /etc/dhcpcd.conf.orig
    fi
    echo "
interface wlan0
nohook wpa_supplicant
static ip_address=192.168.4.1/24
denyinterfaces eth0
denyinterfaces wlan0
    ">/etc/dhcpcd.conf
}

function set_dhcp(){
    echo "Configuration du scope dhcp"
    if [[ ! -f /etc/dnsmasq.conf.orig ]]; then
        echo "Sauvegarde du fichier de conf initial"
        cp /etc/dnsmasq.conf /etc/dnsmasq.conf.orig
    fi
    echo "
interface=wlan0
dhcp-range=192.168.4.2,192.168.4.30,255.255.255.0,24h
    ">/etc/dnsmasq.conf
}

function set_ap(){
    echo "Ecriture des informations de config pour l'AP"
    echo "
interface=wlan0
bridge=br0
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
ssid=Buzz
wpa_passphrase=Buzz2022
    ">/etc/hostapd/hostapd.conf
}

function set_hostapd_file_conf(){
    if [[ ! -f /etc/default/hostapd.orig ]]; then
        echo "Sauvegarde du fichier de config de base"
        cp /etc/default/hostapd /etc/default/hostapd.orig
    fi
    echo "DAEMON_CONF=\"/etc/hostapd/hostapd.conf\"">/etc/default/hostapd
}

function set_traffic_forwarding(){
    if [[ ! -f /etc/sysctl.conf.orig ]]; then
        echo "Sauvegarde du fichier de config de base"
        cp /etc/sysctl.conf /etc/sysctl.conf.orig
    fi
    echo "net.ipv4.ip_forward=1">/etc/sysctl.conf
}

function set_firewall_rules(){
    echo "definition du nat pour router le traffic vers eth0"
    iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
    echo "Sauvegarde de la configuration vers un fichier"
    sh -c "iptables-save > /etc/iptables.ipv4.nat"
    if [[ ! -f /etc/rc.local.orig ]]; then
        cp /etc/rc.local /etc/rc.local.orig
    fi
    #ajout du fichier sauvegardé dans rc local pour l'importer dans iptable. Permet la persistence
    
    local lastline=$(tail -n 2 /etc/rc.local)
    if [[ ! $lastline == *"iptables-restore"* ]]; then
        #on supprime la derniere ligne du fichier qui contient le exit 0
        sed '$d' -i /etc/rc.local
        
        # on append la ligne qui donne les regles à iptable
        
        echo "iptables-restore < /etc/iptables.ipv4.nat">>/etc/rc.local
        # et on append le exit 0
        
        echo "exit 0">>/etc/rc.local
    fi
    
}

function enable_bridge_iface(){
    if [[ ! -f /etc/network/interfaces.orig ]]; then
        cp /etc/network/interfaces /etc/network/interfaces.orig
    fi
    # On crée l'interface br0
    brctl addbr br0
    # on connecte eth0 à br0
    brctl addif br0 eth0
    #on renseigne le fichier interface avec la nouvelle interface br0
    echo "
auto br0
iface br0 inet manual
bridge_ports eth0 wlan0
    ">>/etc/network/interfaces
    
}

function wifiap(){
    install_wifi_prerequisites
    set_fixed_ip
    set_dhcp
    set_ap
    set_hostapd_file_conf
    # set_traffic_forwarding
    # set_firewall_rules
    enable_bridge_iface
    
}

function restore_wifi(){
    systemctl stop hostapd
    systemctl stop dnsmasq
    brctl delif br0 eth0
    brctl delbr br0
    cp /etc/network/interfaces.orig /etc/network/interfaces
    cp /etc/rc.local.orig /etc/rc.local
    cp /etc/sysctl.conf.orig /etc/sysctl.conf
    cp /etc/default/hostapd.orig /etc/default/hostapd
    cp /etc/dhcpcd.conf.orig /etc/dhcpcd.conf
    apt remove hostapd dnsmasq bridge-utils
    systemctl disable hostapd
    systemctl disable dnsmasq
    
}

case "$1" in
    start)
        check_env
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
        check_env
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
        check_env
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
        remove_python_requirements
        remove_prerequisites
    ;;
    
    setap)
        check_root
        if [[ $? == 0 ]]; then
            echo "Les privilèges root sont nécesaires pour cette option"
            exit 1
            
        else
            wifiap
        fi
    ;;
    restorewifi)
        restore_wifi
    ;;
    
    *)
        echo "utilisation : "
        
    ;;
esac
