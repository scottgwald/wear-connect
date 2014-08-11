from PIL import Image
from PIL import ImageFont
from PIL import ImageDraw

nExamples = 10

img = Image.open("wear-connect-test.jpg")
draw = ImageDraw.Draw(img)
# font = ImageFont.truetype(<font-file>, <font-size>)
font = ImageFont.truetype("Roboto-Bold.ttf", 128)
# draw.text((x, y),"Sample Text",(r,g,b))

y = 0
yDelt = 100

for i in range(nExamples):
    draw.text((200, y),"WearConnect",(255,255,255),font=font)
    img.save('text-wear-connect-test-%s.jpg' %(str(i).zfill(3)))
    y += yDelt
