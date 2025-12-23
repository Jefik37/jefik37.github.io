const groups = {
    "upper_letters": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "lower_letters": "abcdefghijklmnopqrstuvwxyz",
    "numbers": "0123456789",
    "logograms": "#%&^`~$@",
    "extended_ascii": "¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ",
    "ponctuation": ".,;:",
    "quotes": "\"'",
    "slashes": "/\\",
    "math_symbols": "+-*=<>!?",
    "parentheses": "()[]{}"
};

let clipboardtimeout;

const similar_chars = new Set("0O1lI|vVuU");

const colors = {
    'very_weak': 'rgb(239, 68, 68)',
    'weak': 'rgb(251, 146, 60)',
    'fair': 'rgb(234, 179, 8)',
    'strong': 'rgb(132, 204, 22)',
    'very_strong': 'rgb(34, 197, 94)'
};

function generate_char_list(){

    let characters = document.getElementById("extra_chars").value;

    for(let group in groups){
        if(document.getElementById(group).checked){
            characters += groups[group];
        }
    }

    const excluded_chars = new Set(document.getElementById("excluded_chars").value);

    characters = new Set(characters);
    characters = [...characters].filter(x => !excluded_chars.has(x));

    if(document.getElementById('exclude_similar').checked){
        return [...characters].filter(x => !similar_chars.has(x));
    }

    return Array.from(characters);

}

function update_password_quality(){
    
    const password = document.getElementById("password_input").value;
    const entropy = calculate_entropy(password);
    let password_quality = get_password_quality(entropy);
    let entropy_slider_length = entropy<200? entropy/2 : 200;

    document.getElementById('entropy_slider').style.backgroundColor = colors[password_quality];
    document.getElementById('entropy_slider').style.width = entropy_slider_length+"%";

    document.getElementById('entropy_value').textContent = entropy.toFixed(2)+' bit';
    document.getElementById('password_quality').className = password_quality;

    password_quality = password_quality.split('_');
    password_quality = password_quality.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    document.getElementById('password_quality').textContent = password_quality;
}

function update_char_count(){

    const password_length = document.getElementById("password_input").value.length;

    document.getElementById("password_char_length").textContent = password_length;

    update_password_quality();

}

function get_password_quality(entropy) {
    if (entropy < 40) return "very_weak";
    if (entropy < 60) return "weak";
    if (entropy < 80) return "fair";
    if (entropy < 100) return "strong";
    return "very_strong";
}

function calculate_entropy(password) {
    const freq = {};
    for(let char of password) {
        freq[char] = (freq[char] || 0) + 1;
    }
    
    let entropy = 0;
    const len = password.length;
    
    for(let char in freq) {
        const p = freq[char] / len;
        entropy -= p * Math.log2(p);
    }
    
    return entropy * len;
}

function subtract_set(set_a, set_b){
    let result = new Set(set_a);
    result = [...result].filter(x => !set_b.has(x));

    return result;
}

function randomize_all_groups(){

    let password = [];
    let group;

    const excluded_chars = new Set(document.getElementById("excluded_chars").value);

    for (let key in groups) {
        if(document.getElementById(key).checked){
            group = subtract_set(groups[key], excluded_chars)
            password.push(group[Math.floor(Math.random() * group.length)]);
        }
    }

    if(document.getElementById('extra_chars').value){
        group = subtract_set(document.getElementById('extra_chars').value, excluded_chars);
        password.push(group[Math.floor(Math.random() * group.length)]);
    }

    return password;
}

function shuffleString(str){
    let array = str.split('');
    
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array.join('');
}

function randomize_password(characters, password_length){
    let passwordArray = [];

    if (document.getElementById('use_all_groups').checked) {
        passwordArray = randomize_all_groups();
    }

    let allChars = characters;

    while (passwordArray.length < password_length) {
        passwordArray.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }

    let password = shuffleString(passwordArray.join(''));

    document.getElementById("password_input").value = password;
    update_password_quality();
}

function generate_password(){

    const characters = generate_char_list();
    const password_length = document.getElementById("password_length").value;

    validate_checkboxes();
    if(!document.getElementById("refresh_button").disabled){
        document.getElementById("password_char_length").textContent = password_length;

        randomize_password(characters, password_length);
        // for(let i=5; i<15; i++){
        //     setTimeout(() => randomize_password(characters, password_length), i*i);
        // }

    }
};

function validate_checkboxes(){

    let quant_checked = 0
    let refresh_button = document.getElementById("refresh_button");
    const password_length = document.getElementById("password_length").value;
    refresh_button.disabled = true;
    
    if(document.getElementById("extra_chars").value){
        refresh_button.disabled = false;
        quant_checked++;
    }

    for(let group in groups){
        if(document.getElementById(group).checked){
            refresh_button.disabled = false;
            quant_checked++;
            group = new Set(groups[group]);
            const excluded_chars = new Set(document.getElementById('excluded_chars').value);
            group = subtract_set(group, excluded_chars);
            if(group.length === 0){refresh_button.disabled = true;}
        }
    }

    if(quant_checked > password_length){refresh_button.disabled = true;}

    refresh_button.classList.toggle('inactive_refresh', refresh_button.disabled);
}

function copy_to_clipboard(){
    const text = document.getElementById('password_input').value;
    navigator.clipboard.writeText(text).then(() => {
        let div_clip = document.getElementById('clipboard_warning');
        div_clip.textContent = 'copied';
        clearTimeout(clipboardtimeout);
        clipboardtimeout = setTimeout(
            () => div_clip.textContent = '', 1000
        )
    }).catch(err => {
        console.error("Error copying to clipboard: ", err);
    });
}

function up_button(){
    document.getElementById('password_length').value++;   
    document.getElementById('password_length_slider').value = document.getElementById('password_length').value
}

function down_button(){
    if(document.getElementById('password_length').value>1){
        document.getElementById('password_length').value--;   
        document.getElementById('password_length_slider').value = document.getElementById('password_length').value
    }
}

function check_eye(){
    let pass_type = document.getElementById('password_input');
    pass_type.type = document.getElementById('eye_checkbox').checked ? "text" : "password";
}

document.addEventListener('click', validate_checkboxes);
document.addEventListener('input', validate_checkboxes);
document.addEventListener('change', validate_checkboxes);

document.getElementById('extra_chars').addEventListener('input', generate_password);
document.getElementById('excluded_chars').addEventListener('input', generate_password);

document.getElementById('exclude_similar').addEventListener('change', generate_password);
document.getElementById('use_all_groups').addEventListener('change', generate_password);

document.getElementById('button_up').addEventListener('click', generate_password);
document.getElementById('button_down').addEventListener('click', generate_password);

for(let group in groups){
    document.getElementById(group).addEventListener('change', generate_password);
}



document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('refresh_button').click();
    }
});

document.getElementById('eye').addEventListener('change', check_eye);

const password_length_slider = document.getElementById('password_length_slider');
const numberInput = document.getElementById('password_length');

password_length_slider.addEventListener('input', function() {
    numberInput.value = this.value;
    generate_password();
});

numberInput.addEventListener('input', function() {
    password_length_slider.value = this.value;
    generate_password();
});

check_eye();
validate_checkboxes();
document.getElementById("refresh_button").disabled ? document.getElementById("password_input").value = '' : generate_password();
document.getElementById('password_input').addEventListener('input', update_char_count);
