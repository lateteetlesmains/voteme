import board
import neopixel
from time import sleep


class Color:
    Red = (255, 0, 0)
    Green = (0, 255, 0)
    Blue = (0, 0, 255)
    Purple = (255, 0, 255)
    Orange = (255, 127, 0)


class Display:

    def __init__(self, pin, numpix) -> None:
        self.pixels = neopixel.NeoPixel(pin, numpix)
        self.texts = {
            'p': [0, 1, 4, 5, 6],
            'o': [0, 1, 2, 3, 4, 5],
            'u': [1, 2, 3, 4, 5],
            't': [3, 4, 5, 6],
            '0': [0, 1, 2, 3, 4, 5],
            '1': [1, 2],
            '2': [0, 1, 3, 4, 6],
            '3': [0, 1, 2, 3, 6],
            '4': [1, 2, 5, 6],
            '5': [0, 2, 3, 5, 6],
            '6': [0, 2, 3, 4, 5, 6],
            '7': [0, 1, 2],
            '8': [0, 1, 2, 3, 4, 5, 6],
            '9': [0, 1, 2, 3, 5, 6]

        }

    def __format(self, text):

        outList = []
        if not str(text).isnumeric():
            return [self.texts[txt] for txt in str(text) if txt in self.texts]
            # return [self.texts[text]]

        for nb in str(text):
            outList.append(self.texts[nb])
        return outList

    def draw(self, screen, text, color):

        screens = {
            1: (0, 1, 2, 3, 4, 5, 6),
            2: (7, 8, 9, 10, 11, 12, 13),
            3: (14, 15, 16, 17, 18, 19, 20),
            4: (21, 22, 23, 24, 25, 26, 27),
            5: (28, 29, 30, 31, 32, 33, 34)
        }
        
        formatted_text = self.__format(text)
        screen_offset = screen
        if len(formatted_text) > len(screens):
            print("Pas de place")
            self.draw(2, 'out', Color.Red)
            return
        if screen + len(formatted_text) > len(screens):
            screen_offset = 1 + (screen - len(formatted_text))
        
        for pix in formatted_text:
            for offled in screens[screen_offset]:
                self.pixels[offled] = (0,0,0) #reset des pixel du screen avant d'ecrire

            for led in pix:
                self.pixels[screens[screen_offset][led]] = color
            screen_offset += 1

if __name__ == '__main__':
    d = Display(board.D18, 35)
    d.draw(5,125,Color.Green)

# pixels.fill((0,255,0))
# pixels[0] = (255, 255, 0)
