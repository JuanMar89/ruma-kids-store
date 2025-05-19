from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

options = Options()
options.add_argument("--start-maximized")
driver = webdriver.Chrome(options=options)
driver.get("https://www.avellanedaauntoque.com/catalogo-local/25741")

WebDriverWait(driver, 20).until(
    EC.presence_of_element_located((By.CSS_SELECTOR, "a[href*='/producto/']"))
)

productos = driver.find_elements(By.CSS_SELECTOR, "a[href*='/producto/']")
productos_data = []

for p in productos:
    try:
        # Subimos al contenedor padre .card
        card = p.find_element(By.XPATH, "./ancestor::div[contains(@class, 'card')]")

        nombre = p.find_element(By.CSS_SELECTOR, ".truncate").text.strip()

        parrafos = p.find_elements(By.CSS_SELECTOR, "p.center-align")

        # Buscar todos los spans con clase ng-binding (algunos están ocultos)
        spans = card.find_elements(By.CSS_SELECTOR, "span.ng-binding")
        precio = ""
        for span in spans:
            if span.is_displayed() and "$" in span.text:
                precio = span.text.strip()
                break

        imagen = p.find_element(By.TAG_NAME, "img").get_attribute("src")
        link = p.get_attribute("href")

        if nombre and precio and imagen:
            productos_data.append({
                "nombre": nombre,
                "precio": precio,
                "imagen": imagen,
                "link": link
            })

    except Exception as e:
        print("Error:", e)

driver.quit()

# Generar HTML
cards = ""
for p in productos_data:
    cards += f'''
    <div class="card">
      <img src="{p['imagen']}" alt="{p['nombre']}">
      <div class="info">
        <h3 class="card-title">{p['nombre']}</h3>
        <p class="precio">{p['precio']}</p>
        <a class="btn-whatsapp" target="_blank" href="https://wa.me/5491173618169/?text=Hola%20quiero%20comprar%20el%20{p['nombre']}">Comprar por WhatsApp</a>
      </div>
    </div>
    '''

with open("productos.html", "w", encoding="utf-8") as f:
    f.write(cards)

print("✅ Productos guardados en productos.html")
